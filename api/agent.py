import os
import httpx
from typing import TypedDict, Annotated, Sequence
from langchain_core.tools import tool
from langchain_core.messages import BaseMessage, HumanMessage
from langgraph.graph import StateGraph, END, add_messages
from langgraph.prebuilt import ToolNode
from langchain_anthropic import ChatAnthropic

from tools.geocoder import geocode
from tools.pluto import fetch_pluto
from tools.acris import fetch_comparables

# Define the State
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]

@tool
async def lookup_property(address: str) -> str:
    """Use this tool to find information about an NYC property by its address. 
    It returns geocoding data and rich PLUTO data including zoning, building square footage (BSF), and lot characteristics."""
    async with httpx.AsyncClient() as http:
        try:
            geo = await geocode(http, address)
            pluto = await fetch_pluto(http, geo.bbl)
            return f"GEO: {geo.model_dump_json()}\nPLUTO: {pluto.model_dump_json()}"
        except Exception as e:
            return f"Error looking up property: {e}"

@tool
async def get_recent_sales(borough_code: str, block: str, lot: str) -> str:
    """Use this tool to fetch recent comparable sales data (ACRIS) for a given property.
    Requires borough_code, block, and lot which you should get from lookup_property first."""
    async with httpx.AsyncClient() as http:
        try:
            comps = await fetch_comparables(http, borough_code, block, lot)
            return f"Found {len(comps)} recent sales: {[c.model_dump() for c in comps]}"
from rag import get_zoning_rule

@tool
async def check_zoning_code(district: str) -> str:
    """Use this tool to fetch the exact zoning text for a given NYC zoning district (e.g. 'R1', 'C4').
    This helps you understand what can be built on the lot."""
    try:
        return get_zoning_rule(district)
    except Exception as e:
        return f"Error: {e}"

tools = [lookup_property, get_recent_sales, check_zoning_code]
tool_node = ToolNode(tools)

def get_model():
    return ChatAnthropic(
        model="claude-3-5-sonnet-20241022",
        temperature=0,
        api_key=os.environ.get("ANTHROPIC_API_KEY", "dummy")
    ).bind_tools(tools)

async def call_model(state: AgentState):
    model = get_model()
    response = await model.ainvoke(state["messages"])
    return {"messages": [response]}

def should_continue(state: AgentState):
    messages = state["messages"]
    last_message = messages[-1]
    if not last_message.tool_calls:
        return "end"
    return "continue"

workflow = StateGraph(AgentState)
workflow.add_node("agent", call_model)
workflow.add_node("action", tool_node)

workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", should_continue, {"continue": "action", "end": END})
workflow.add_edge("action", "agent")

app = workflow.compile()
