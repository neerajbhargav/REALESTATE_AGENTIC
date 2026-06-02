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
            "(BBL, borough_code, block, lot) plus PLUTO zoning and lot "
            "characteristics (zoning district, residential FAR, lot area, "
            "owner, year built)."
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
]


# ---------------------------------------------------------------------------
# Tool execution
# ---------------------------------------------------------------------------
async def _execute_tool(name: str, args: dict) -> str:
    """Run one tool and return its string result."""
    async with httpx.AsyncClient() as http:
        try:
            if name == "lookup_property":
                geo = await geocode(http, args["address"])
                pluto = await fetch_pluto(http, geo.bbl)
                return (
                    f"GEO: {geo.model_dump_json()}\n"
                    f"PLUTO: {pluto.model_dump_json()}"
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
SYSTEM_PROMPT = """You are a highly advanced commercial real estate autonomous agent.
Your goal is to evaluate NYC properties by autonomously pulling data and running calculations.
Always use your tools to pull the PLUTO data and recent sales (ACRIS) before making an assessment.

When giving your final assessment, format it beautifully with clear sections:
- Executive Summary
- Zoning & Lot Characteristics
- Development Potential (calculate BSF based on lot_area * residfar)
- Comparable Sales & Land Value
- Risk Flags

Be precise, professional, and always cite your data sources."""


async def run_agent_stream(address: str):
    """Async generator that yields SSE-formatted strings.

    The loop:
    1. Send messages to Claude with tools.
    2. If Claude responds with tool_use blocks, execute them and loop.
    3. If Claude responds with text, stream it out and finish.
    """
    client = _get_client()
    messages = [
        {"role": "user", "content": f"Please run a full site assessment on {address}."}
    ]

    yield f"data: {json.dumps({'type': 'status', 'content': f'Starting analysis for {address}...'})}\n\n"

    MAX_LOOPS = 8  # safety cap
    for _ in range(MAX_LOOPS):
        # --- Try streaming first for the final text response ---
        # We need to detect tool_use vs text. Use non-streaming to check.
        response = await client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )

        # Collect tool calls and text blocks
        tool_calls = []
        text_parts = []
        for block in response.content:
            if block.type == "tool_use":
                tool_calls.append(block)
            elif block.type == "text":
                text_parts.append(block.text)

        if tool_calls:
            # Execute each tool call
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

            # Append assistant message (with tool_use blocks) and tool results
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})
            continue  # loop back for next Claude call

        # No tool calls — this is the final text response. Stream it.
        if text_parts:
            full_text = "\n".join(text_parts)
            # Stream in chunks for a nice typing effect
            chunk_size = 12
            for i in range(0, len(full_text), chunk_size):
                chunk = full_text[i:i + chunk_size]
                yield f"data: {json.dumps({'type': 'content_chunk', 'content': chunk})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return

    # If we hit max loops, signal completion anyway
    yield f"data: {json.dumps({'type': 'done'})}\n\n"
