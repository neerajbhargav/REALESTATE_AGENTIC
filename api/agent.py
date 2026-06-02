"""Lightweight agentic loop — calls Anthropic directly with tool_use.

Eliminates the massive langgraph/langchain dependency tree that crashes
Vercel serverless. Same agentic behaviour: Claude decides which tools to
call, we execute them, and loop until Claude produces a final text response.
"""
import os
import json
import httpx
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

MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-5-20250929")

# ---------------------------------------------------------------------------
# Tool definitions (Anthropic native format)
# ---------------------------------------------------------------------------
TOOLS = [
    {
        "name": "lookup_property",
        "description": (
            "Find information about a NYC property by address: geocoding "
            "(BBL, borough_code, block, lot, lat, lon) plus PLUTO zoning and lot "
            "characteristics (zoning district, residential FAR, commercial FAR, "
            "facility FAR, lot area, building area, owner, year built, land use)."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "address": {
                    "type": "string",
                    "description": "NYC street address to look up"
                }
            },
            "required": ["address"],
        },
    },
    {
        "name": "get_recent_sales",
        "description": (
            "Fetch recent comparable DEED sales (ACRIS) near a property. "
            "Requires borough_code, block, and lot from lookup_property."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "borough_code": {"type": "string"},
                "block": {"type": "string"},
                "lot": {"type": "string"},
            },
            "required": ["borough_code", "block", "lot"],
        },
    },
    {
        "name": "check_zoning_code",
        "description": (
            "Fetch the plain-English meaning of a NYC zoning district "
            "(e.g. 'R6A', 'C4-2') to understand what can be built."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "district": {
                    "type": "string",
                    "description": "NYC zoning district code"
                }
            },
            "required": ["district"],
        },
    },
    {
        "name": "submit_final_report",
        "description": (
            "Call this tool ONCE to submit your final structured assessment. "
            "You MUST fill in ALL fields from the data you collected. "
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
            "required": ["executive_summary", "zoning_summary", "lot_characteristics", "development_potential", "land_value_estimate", "flags", "data_sources"]
        }
    }
]


# ---------------------------------------------------------------------------
# Tool execution
# ---------------------------------------------------------------------------
async def _execute_tool(name: str, args: dict) -> str:
    """Run one tool and return its string result."""
    if name == "submit_final_report":
        return "Report submitted successfully."

    async with httpx.AsyncClient() as http:
        try:
            if name == "lookup_property":
                geo = await geocode(http, args["address"])
                pluto = await fetch_pluto(http, geo.bbl)
                return (
                    f"GEO: {geo.model_dump_json()}\n"
                    f"PLUTO: {pluto.model_dump_json()}\n"
                    f"COORDINATES: lat={geo.lat}, lon={geo.lon}\n"
                    f"BBL: {geo.bbl}, BOROUGH: {geo.borough}"
                )
            elif name == "get_recent_sales":
                comps = await fetch_comparables(
                    http, args["borough_code"], args["block"], args["lot"]
                )
                return f"Found {len(comps)} recent sales: {[c.model_dump() for c in comps]}"
            elif name == "check_zoning_code":
                return get_zoning_rule(args["district"])
            else:
                return f"Unknown tool: {name}"
        except Exception as e:
            return f"Tool error ({name}): {e}"


# ---------------------------------------------------------------------------
# Streaming agentic loop
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are a highly advanced commercial real estate autonomous agent built for NYC brokers and investors.
Your goal is to evaluate NYC development sites by autonomously pulling data and running calculations.

WORKFLOW:
1. Call `lookup_property` to get geocoding (BBL, coordinates) and PLUTO data (zoning, FAR, lot area, building area).
2. Call `check_zoning_code` with the zoning district from PLUTO to get zoning description.
3. Call `get_recent_sales` with the borough_code, block, and lot to get ACRIS comparable sales.
4. COMPUTE the key metrics yourself:
   - Buildable SF (BSF) = lot_area × residential_far
   - Currently built FAR = building_area / lot_area
   - Utilization % = (currently_built_far / residential_far) × 100
   - Remaining development = BSF - building_area
   - Estimated $/BSF from comparable sales (sale_price / lot_area for nearby)
   - Total estimated value = $/BSF × buildable_sf

5. Call `submit_final_report` with ALL computed data. Fill in EVERY field. Include:
   - coordinates from geocoder (lat, lon) — CRITICAL for the map
   - bbl and borough
   - executive_summary (3-5 sentence broker-grade opportunity summary)
   - All lot characteristics (lot_area_sf, building_area_sf, year_built, owner, etc.)
   - All development potential numbers (FAR, BSF, utilization, is_underbuilt)
   - comparable_sales with all fields from ACRIS data
   - land_value_estimate with narrative, $/BSF, and total value
   - flags (risk factors, caveats)
   - data_sources list

IMPORTANT: Do NOT write a text response. Your ONLY final output must be the submit_final_report tool call.
Be precise with numbers. Always cite data sources. This is for professional broker use."""


async def run_agent_stream(address: str):
    """Async generator that yields SSE-formatted strings.

    The loop:
    1. Send messages to Claude with tools.
    2. If Claude responds with tool_use blocks, execute them and loop.
    3. If Claude responds with text, stream it out.
    4. If Claude calls `submit_final_report`, emit a special event and finish.
    """
    client = _get_client()
    messages = [
        {"role": "user", "content": f"Please run a full site assessment on {address}. Remember to include coordinates and ALL numeric fields."}
    ]

    yield f"data: {json.dumps({'type': 'status', 'content': f'Starting analysis for {address}...'})}\n\n"

    MAX_LOOPS = 8  # safety cap
    for _ in range(MAX_LOOPS):
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

        # Stream any intermediate text thought process
        if text_parts:
            full_text = "\n".join(text_parts)
            chunk_size = 12
            for i in range(0, len(full_text), chunk_size):
                chunk = full_text[i:i + chunk_size]
                yield f"data: {json.dumps({'type': 'content_chunk', 'content': chunk})}\n\n"

        if tool_calls:
            # Check for final report
            for tc in tool_calls:
                if tc.name == "submit_final_report":
                    yield f"data: {json.dumps({'type': 'final_report', 'content': tc.input})}\n\n"
                    yield f"data: {json.dumps({'type': 'done'})}\n\n"
                    return

            # Execute intermediate tools
            tool_results = []
            for tc in tool_calls:
                yield f"data: {json.dumps({'type': 'status', 'content': f'Running tool: {tc.name}...'})}\n\n"
                result = await _execute_tool(tc.name, tc.input)
                yield f"data: {json.dumps({'type': 'status', 'content': f'✓ Finished: {tc.name}'})}\n\n"
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tc.id,
                    "content": result,
                })

            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})
            continue

        yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return

    yield f"data: {json.dumps({'type': 'done'})}\n\n"
