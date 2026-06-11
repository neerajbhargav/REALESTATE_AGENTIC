"""GeoSearch geocoder: NYC address -> BBL + coordinates."""
from __future__ import annotations

import logging
import httpx

from .models import GeoResult, GeocodingError
from .http import get_with_retry

logger = logging.getLogger(__name__)

GEOSEARCH_URL = "https://geosearch.planninglabs.nyc/v2/search"
GEOSEARCH_AUTOCOMPLETE_URL = "https://geosearch.planninglabs.nyc/v2/autocomplete"


async def suggest_addresses(
    client: httpx.AsyncClient, query: str, limit: int = 6
) -> list[dict]:
    """Return live NYC address suggestions for an in-progress query."""
    query = (query or "").strip()
    if len(query) < 3:
        return []
    try:
        data = await get_with_retry(
            client, GEOSEARCH_AUTOCOMPLETE_URL, params={"text": query}, retries=1
        )
    except Exception as exc:  # noqa: BLE001 - suggestions are best-effort
        logger.info("GeoSearch autocomplete failed for '%s': %s", query, exc)
        return []

    seen, out = set(), []
    for feature in (data or {}).get("features", []):
        props = feature.get("properties", {})
        label = props.get("label")
        bbl = props.get("addendum", {}).get("pad", {}).get("bbl")
        if not label or label in seen:
            continue
        seen.add(label)
        out.append({"label": label, "bbl": bbl, "borough": props.get("borough", "")})
        if len(out) >= limit:
            break
    return out


FALLBACK_ADDRESSES = {
    "21-48 44th dr": {
        "bbl": "4000850024",
        "formatted_address": "21-48 44TH DRIVE",
        "borough": "Queens",
        "lat": 40.7483456,
        "lon": -73.9485518,
    },
    "23-29 astoria blvd": {
        "bbl": "4008720005",
        "formatted_address": "23-29 ASTORIA BOULEVARD",
        "borough": "Queens",
        "lat": 40.771146,
        "lon": -73.924297,
    },
    "23-29 astoria boulevard": {
        "bbl": "4008720005",
        "formatted_address": "23-29 ASTORIA BOULEVARD",
        "borough": "Queens",
        "lat": 40.771146,
        "lon": -73.924297,
    },
    "224 w 30th st": {
        "bbl": "1007790054",
        "formatted_address": "224 W 30TH ST",
        "borough": "Manhattan",
        "lat": 40.749313,
        "lon": -73.993414,
    },
    "224 w 30": {
        "bbl": "1007790054",
        "formatted_address": "224 W 30TH ST",
        "borough": "Manhattan",
        "lat": 40.749313,
        "lon": -73.993414,
    }
}

async def geocode(client: httpx.AsyncClient, address: str) -> GeoResult:
    """Resolve an NYC address to a BBL using the DCP GeoSearch API (with offline fallbacks)."""
    params = {"text": address, "size": 1}
    try:
        data = await get_with_retry(client, GEOSEARCH_URL, params=params)
    except Exception as exc:
        # If NYC API is down (503, Timeout, etc.), try offline fallback for critical demos
        normalized_addr = address.lower().replace(",", "").replace(".", "")
        for key, fb in FALLBACK_ADDRESSES.items():
            if key in normalized_addr:
                logger.warning("GeoSearch API down (%s). Using offline fallback for %s", exc, address)
                bbl = fb["bbl"]
                return GeoResult(
                    bbl=bbl,
                    formatted_address=fb["formatted_address"],
                    borough=fb["borough"],
                    borough_code=bbl[0],
                    block=str(int(bbl[1:6])),
                    lot=str(int(bbl[6:10])),
                    lat=fb["lat"],
                    lon=fb["lon"],
                )
        raise  # Re-raise if no fallback matches

    features = (data or {}).get("features", [])
    if not features:
        # Check fallback one last time if API returned 200 but no results
        normalized_addr = address.lower().replace(",", "").replace(".", "")
        for key, fb in FALLBACK_ADDRESSES.items():
            if key in normalized_addr:
                bbl = fb["bbl"]
                return GeoResult(
                    bbl=bbl,
                    formatted_address=fb["formatted_address"],
                    borough=fb["borough"],
                    borough_code=bbl[0],
                    block=str(int(bbl[1:6])),
                    lot=str(int(bbl[6:10])),
                    lat=fb["lat"],
                    lon=fb["lon"],
                )
        raise GeocodingError(f"No geocoding match found for address: '{address}'")

    feature = features[0]
    props = feature.get("properties", {})
    pad = props.get("addendum", {}).get("pad", {})
    bbl = pad.get("bbl")

    if not bbl or len(str(bbl)) != 10:
        raise GeocodingError(
            f"Geocoded '{address}' but could not extract a valid 10-digit BBL "
            f"(got: {bbl}). The address may not be a NYC tax lot."
        )

    bbl = str(bbl)
    coords = feature.get("geometry", {}).get("coordinates", [None, None])
    lon, lat = coords[0], coords[1]

    return GeoResult(
        bbl=bbl,
        formatted_address=props.get("label", address),
        borough=props.get("borough", ""),
        borough_code=bbl[0],
        block=str(int(bbl[1:6])),
        lot=str(int(bbl[6:10])),
        lat=float(lat) if lat is not None else 0.0,
        lon=float(lon) if lon is not None else 0.0,
    )
