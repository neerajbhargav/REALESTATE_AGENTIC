"""LangGraph ReAct agent for autonomous NYC site analysis.

Tools:
  - lookup_property(address)       -> GeoSearch + PLUTO
  - get_recent_sales(borough,blk,lot) -> ACRIS comparable deeds
  - check_zoning_code(district)    -> local zoning RAG
"""
import os

import httpx
from typing import TypedDict, Annotated, Sequence

from langchain_core.tools import tool
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langchain_anthropic import ChatAnthropic

from tools.geocoder import geocode
from tools.pluto import fetch_pluto
from tools.acris import fetch_comparables
from rag import get_zoning_rule


# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------
@tool
async def lookup_property(address: str) -> str:
    """Find information about a NYC property by address: geocoding (BBL,
    borough_code, block, lot) plus PLUTO zoning and lot characteristics
    (zoning district, residential FAR, lot area, owner, year built)."""
    async with httpx.AsyncClient() as http:
        try:
            geo = await geocode(http, address)
            pluto = await fetch_pluto(http, geo.bbl)
            return (
                f"GEO: {geo.model_dump_json()}\n"
                f"PLUTO: {pluto.model_dump_json()}"
            )
        except Exception as e:  # noqa: BLE001 - surface error text to the model
            return f"Error looking up property: {e}"


@tool
async def get_recent_sales(borough_code: str, block: str, lot: str) -> str:
    """Fetch recent comparable DEED sales (ACRIS) near a property. Requires
    borough_code, block, and lot, which come from lookup_property first."""
    async with httpx.AsyncClient() as http:
        try:
            comps = await fetch_comparables(http, borough_code, block, lot)
            return f"Found {len(comps)} recent sales: {[c.model_dump() for c in comps]}"
        except Exception as e:  # noqa: BLE001
            return f"Error fetching sales: {e}"


@tool
async def check_zoning_code(district: str) -> str:
    """Fetch the plain-English meaning of a NYC zoning district
    (e.g. 'R6A', 'C4-2') to understand what can be built on the lot."""
    try:
        return get_zoning_rule(district)
    except Exception as e:  # noqa: BLE001
        return f"Error: {e}"


tools = [lookup_property, get_recent_sales, check_zoning_code]
tool_node = ToolNode(tools)


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------
def get_model():
    return ChatAnthropic(
        model=os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-5-20250929"),
        temperature=0,
        api_key=os.environ.get("ANTHROPIC_API_KEY", "dummy"),
        max_tokens=4096,
    ).bind_tools(tools)


async def call_model(state: AgentState):
    model = get_model()
    response = await model.ainvoke(state["messages"])
    return {"messages": [response]}


def should_continue(state: AgentState):
    last_message = state["messages"][-1]
    if not getattr(last_message, "tool_calls", None):
        return "end"
    return "continue"


# ---------------------------------------------------------------------------
# Graph
# ---------------------------------------------------------------------------
workflow = StateGraph(AgentState)
workflow.add_node("agent", call_model)
workflow.add_node("action", tool_node)
workflow.set_entry_point("agent")
workflow.add_conditional_edges(
    "agent", should_continue, {"continue": "action", "end": END}
)
workflow.add_edge("action", "agent")

app = workflow.compile()
