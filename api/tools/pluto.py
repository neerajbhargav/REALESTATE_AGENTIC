"""PLUTO data fetcher + parser."""
from __future__ import annotations

import logging
from typing import Optional

import httpx

from .models import PLUTOData, PLUTONotFoundError
from .http import get_with_retry

logger = logging.getLogger(__name__)

PLUTO_URL = "https://data.cityofnewyork.us/resource/64uk-42ks.json"


def _to_float(value, default: Optional[float] = 0.0) -> Optional[float]:
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (ValueError, TypeError):
        return default


def _to_int(value) -> Optional[int]:
    try:
        if value is None or value == "":
            return None
        i = int(float(value))
        return i if i > 0 else None
    except (ValueError, TypeError):
        return None


async def fetch_pluto(client: httpx.AsyncClient, bbl: str) -> PLUTOData:
    """Fetch lot + zoning data from PLUTO for a given BBL."""
    data = await get_with_retry(client, PLUTO_URL, params={"bbl": bbl})

    if not data:
        raise PLUTONotFoundError(
            f"BBL {bbl} not found in the PLUTO database. "
            f"The lot may be newly created, a condo unit, or outside the dataset."
        )

    row = data[0]
    return PLUTOData(
        bbl=bbl,
        address=row.get("address", ""),
        borough=row.get("borough", ""),
        block=row.get("block", ""),
        lot=row.get("lot", ""),
        zonedist1=row.get("zonedist1", ""),
        zonedist2=row.get("zonedist2"),
        spdist1=row.get("spdist1"),
        residfar=_to_float(row.get("residfar")),
        commfar=_to_float(row.get("commfar")),
        facilfar=_to_float(row.get("facilfar")),
        lotarea=_to_float(row.get("lotarea")),
        bldgarea=_to_float(row.get("bldgarea")),
        builtfar=_to_float(row.get("builtfar")),
        numfloors=_to_float(row.get("numfloors"), default=None),
        unitsres=_to_int(row.get("unitsres")),
        yearbuilt=_to_int(row.get("yearbuilt")),
        ownername=row.get("ownername", ""),
        ownertype=row.get("ownertype"),
        landuse=row.get("landuse", ""),
        bldgclass=row.get("bldgclass"),
        assesstot=_to_float(row.get("assesstot"), default=None),
        assessland=_to_float(row.get("assessland"), default=None),
    )
