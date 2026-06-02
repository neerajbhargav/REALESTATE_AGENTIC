"""Optimized agentic loop — pre-fetches all data in parallel to bypass multi-turn latency.

Spawns a single turn LLM call to synthesize the opportunity report and estimate values.
Eliminates AWS Lambda/Vercel serverless timeout issues.
"""
import os
import json
import httpx
import asyncio
from anthropic import AsyncAnthropic

from tools.geocoder import geocode
from tools.pluto import fetch_pluto
from tools.acris import fetch_comparables
from rag import get_zoning_rule

# ---------------------------------------------------------------------------
# Anthropic client
# ---------------------------------------------------------------------------
def _get_client() -> AsyncAnthropic:
    return AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")

# ---------------------------------------------------------------------------
# Tool definitions (Anthropic native format)
# ---------------------------------------------------------------------------
TOOLS = [
    {
        "name": "submit_final_report",
        "description": (
            "Call this tool ONCE to submit your final structured assessment. "
            "You MUST fill in ALL fields from the pre-fetched data provided. "
            "Compute buildable SF = lot_area_sf × residential_far. "
            "Compute total_estimated_value = estimated_value_per_bsf × buildable_sf. "
            "Include the coordinates (lat/lon) from the geocoder for the map."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "executive_summary": {
                    "type": "string",
                    "description": "A 3-5 sentence professional executive summary of the site opportunity for a broker/investor audience."
                },
                "coordinates": {
                    "type": "object",
                    "description": "Latitude/longitude from geocoder results.",
                    "properties": {
                        "lat": {"type": "number"},
                        "lon": {"type": "number"}
                    }
                },
                "bbl": {"type": "string", "description": "The 10-digit BBL"},
                "borough": {"type": "string"},
                "zoning_summary": {
                    "type": "object",
                    "properties": {
                        "district": {"type": "string"},
                        "description": {"type": "string"}
                    }
                },
                "lot_characteristics": {
                    "type": "object",
                    "properties": {
                        "lot_area_sf": {"type": "number"},
                        "building_area_sf": {"type": "number"},
                        "year_built": {"type": "string"},
                        "land_use_description": {"type": "string"},
                        "owner": {"type": "string"},
                        "num_floors": {"type": "number"},
                        "num_units": {"type": "number"}
                    }
                },
                "development_potential": {
                    "type": "object",
                    "properties": {
                        "methodology": {"type": "string", "description": "Explain the BSF calculation clearly"},
                        "lot_area_sf": {"type": "number"},
                        "residential_far": {"type": "number"},
                        "commercial_far": {"type": "number"},
                        "facility_far": {"type": "number"},
                        "currently_built_far": {"type": "number"},
                        "residential_bsf": {"type": "number", "description": "lot_area_sf × residential_far"},
                        "commercial_bsf": {"type": "number"},
                        "facility_bsf": {"type": "number"},
                        "currently_built_sf": {"type": "number"},
                        "remaining_development_potential": {"type": "number"},
                        "utilization_pct": {"type": "number", "description": "Percentage of FAR used (0-100)"},
                        "is_underbuilt": {"type": "boolean"}
                    }
                },
                "comparable_sales": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "address": {"type": "string"},
                            "sale_price": {"type": "number"},
                            "sale_date": {"type": "string"},
                            "block": {"type": "string"},
                            "lot": {"type": "string"},
                            "bbl": {"type": "string"},
                            "document_id": {"type": "string"},
                            "notes": {"type": "string"}
                        }
                    }
                },
                "land_value_estimate": {
                    "type": "object",
                    "properties": {
                        "narrative": {"type": "string", "description": "2-3 sentence valuation rationale"},
                        "estimated_value_per_bsf": {"type": "number"},
                        "total_estimated_value": {"type": "number", "description": "estimated_value_per_bsf × buildable_sf"}
                    }
                },
                "flags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Risk flags, caveats, or key observations"
                },
                "data_sources": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List all NYC public data sources used"
                }
              },
              "required": [
                  "executive_summary",
                  "zoning_summary",
                  "lot_characteristics",
                  "development_potential",
                  "land_value_estimate",
                  "flags",
                  "data_sources"
              ]
        }
    }
]

SYSTEM_PROMPT = """You are an advanced commercial real estate underwriting agent.
We have pre-fetched public records from NYC GeoSearch, PLUTO, and ACRIS.
Your goal is to synthesize this raw data into a professional assessment report for brokers and developers.

First, write a brief, professional markdown analysis showing your thought process and calculations.
Then, call the `submit_final_report` tool with the structured JSON payload.

GUIDELINES FOR VALUES:
1. Coordinates: Use the lat/lon provided in the raw data.
2. Buildable SF (BSF): lot_area_sf × residential_far.
3. Utilization %: (currently_built_sf / (lot_area_sf × residential_far)) * 100.
4. Valuation: Estimate $/BSF based on the ACRIS comps. If no comps exist, use a reasonable market estimate (e.g. $150-$250/BSF for Forest Hills/Queens, $300-$500/BSF for LIC/Brooklyn, $600-$1000/BSF for Manhattan).
5. Compute total estimated value = $/BSF × BSF.
6. Check for underbuilt status: is_underbuilt is True if utilization % < 70%.

Your thought process text will stream to the user, and then the structured tool call will be parsed to draw the dashboard.
Make sure you call the `submit_final_report` tool. Fill in every required field exactly."""

async def run_agent_stream(address: str):
    """Async generator yielding SSE-formatted strings.

    Performs parallel pre-fetching of NYC data APIs, then runs a single LLM turn to stream thoughts and output the structured report.
    """
    client = _get_client()

    yield f"data: {json.dumps({'type': 'status', 'content': 'Geocoding property address...'})}\n\n"

    async with httpx.AsyncClient() as http:
        try:
            # 1. Geocode
            geo = await geocode(http, address)
            yield f"data: {json.dumps({'type': 'status', 'content': f'Resolved address to BBL {geo.bbl} ({geo.borough})'})}\n\n"

            # 2. Fetch PLUTO & ACRIS Comps in parallel
            yield f"data: {json.dumps({'type': 'status', 'content': 'Fetching PLUTO zoning and ACRIS comparable sales in parallel...'})}\n\n"
            
            pluto_task = fetch_pluto(http, geo.bbl)
            comps_task = fetch_comparables(http, geo.borough_code, geo.block, geo.lot)

            pluto_res, comps_res = await asyncio.gather(pluto_task, comps_task, return_exceptions=True)

            if isinstance(pluto_res, Exception):
                raise pluto_res
            
            pluto = pluto_res
            comps = comps_res if not isinstance(comps_res, Exception) else []

            # 3. Fetch zoning text meaning
            yield f"data: {json.dumps({'type': 'status', 'content': 'Retrieving zoning regulations RAG context...'})}\n\n"
            zoning_desc = ""
            if pluto.zonedist1:
                try:
                    zoning_desc = get_zoning_rule(pluto.zonedist1)
                except Exception:
                    zoning_desc = f"Zoning district RAG search failed for {pluto.zonedist1}"

            # 4. Package context for single-turn Claude call
            raw_data = {
                "geosearch": {
                    "bbl": geo.bbl,
                    "borough": geo.borough,
                    "lat": geo.lat,
                    "lon": geo.lon,
                    "formatted_address": geo.formatted_address,
                },
                "pluto": {
                    "address": pluto.address,
                    "borough": pluto.borough,
                    "zonedist1": pluto.zonedist1,
                    "zonedist2": pluto.zonedist2,
                    "residfar": pluto.residfar,
                    "commfar": pluto.commfar,
                    "facilfar": pluto.facilfar,
                    "lotarea": pluto.lotarea,
                    "bldgarea": pluto.bldgarea,
                    "builtfar": pluto.builtfar,
                    "numfloors": pluto.numfloors,
                    "unitsres": pluto.unitsres,
                    "yearbuilt": pluto.yearbuilt,
                    "ownername": pluto.ownername,
                    "landuse": pluto.landuse,
                    "assesstot": pluto.assesstot,
                    "assessland": pluto.assessland,
                },
                "zoning_desc": zoning_desc,
                "comparable_sales": [c.model_dump() for c in comps]
            }

            yield f"data: {json.dumps({'type': 'status', 'content': 'Analyzing site feasibility and underwriting values...'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': f'Feasibility gathering failed: {str(e)}'})}\n\n"
            return

    # Call Claude with all pre-fetched data
    user_prompt = (
        f"Here is the raw geocoding, PLUTO lot, ACRIS comps, and zoning RAG data for {address}:\n"
        f"{json.dumps(raw_data, indent=2)}\n\n"
        "Synthesize this site opportunity. Provide a brief narrative in markdown, and then call submit_final_report."
    )

    messages = [
        {"role": "user", "content": user_prompt}
    ]

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )

        tool_calls = []
        text_parts = []
        for block in response.content:
            if block.type == "tool_use":
                tool_calls.append(block)
            elif block.type == "text":
                text_parts.append(block.text)

        # Stream the thought process text in small chunks to simulate live execution
        if text_parts:
            full_text = "\n".join(text_parts)
            chunk_size = 15
            for i in range(0, len(full_text), chunk_size):
                chunk = full_text[i:i + chunk_size]
                yield f"data: {json.dumps({'type': 'content_chunk', 'content': chunk})}\n\n"
                await asyncio.sleep(0.01)

        if tool_calls:
            for tc in tool_calls:
                if tc.name == "submit_final_report":
                    # Ensure lat/lon coordinates from geocoder are preserved if missing in tool call
                    tc_input = dict(tc.input)
                    if "coordinates" not in tc_input or not tc_input["coordinates"]:
                        tc_input["coordinates"] = {"lat": geo.lat, "lon": geo.lon}
                    if "bbl" not in tc_input or not tc_input["bbl"]:
                        tc_input["bbl"] = geo.bbl
                    if "borough" not in tc_input or not tc_input["borough"]:
                        tc_input["borough"] = geo.borough

                    yield f"data: {json.dumps({'type': 'final_report', 'content': tc_input})}\n\n"
                    yield f"data: {json.dumps({'type': 'done'})}\n\n"
                    return

        # Fallback if Claude didn't call the tool directly
        yield f"data: {json.dumps({'type': 'error', 'content': 'Agent failed to submit structured report payload.'})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'content': f'Underwriting model call failed: {str(e)}'})}\n\n"
