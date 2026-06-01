import os
import httpx
from fastmcp import FastMCP
from tools.geocoder import geocode
from tools.pluto import fetch_pluto
from tools.acris import fetch_comparables

mcp = FastMCP("NYC Real Estate Tools")

@mcp.tool()
async def lookup_property(address: str) -> str:
    """Find NYC property information including BBL, zoning, and building dimensions."""
    async with httpx.AsyncClient() as http:
        try:
            geo = await geocode(http, address)
            pluto = await fetch_pluto(http, geo.bbl)
            return f"GEO: {geo.model_dump_json()}\nPLUTO: {pluto.model_dump_json()}"
        except Exception as e:
            return f"Error: {e}"

@mcp.tool()
async def get_recent_sales(borough_code: str, block: str, lot: str) -> str:
    """Fetch recent comparable sales data (ACRIS) for a given borough_code, block, and lot."""
    async with httpx.AsyncClient() as http:
        try:
            comps = await fetch_comparables(http, borough_code, block, lot)
            return f"Found {len(comps)} recent sales: {[c.model_dump() for c in comps]}"
        except Exception as e:
            return f"Error fetching sales: {e}"

if __name__ == "__main__":
    mcp.run()
