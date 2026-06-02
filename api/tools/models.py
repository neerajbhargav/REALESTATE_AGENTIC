"""Pydantic models and typed exceptions for the NYC site analyzer tools.

This module was missing from the repo, which broke every import in
geocoder.py / pluto.py / acris.py (they all do `from .models import ...`).
"""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------
class GeoResult(BaseModel):
    """Result of geocoding an address to a NYC tax lot (BBL)."""

    bbl: str
    formatted_address: str
    borough: str
    borough_code: str
    block: str
    lot: str
    lat: float = 0.0
    lon: float = 0.0


class PLUTOData(BaseModel):
    """Lot + zoning characteristics from NYC PLUTO."""

    bbl: str
    address: str = ""
    borough: str = ""
    block: str = ""
    lot: str = ""

    # Zoning
    zonedist1: str = ""
    zonedist2: Optional[str] = None
    spdist1: Optional[str] = None
    residfar: Optional[float] = 0.0
    commfar: Optional[float] = 0.0
    facilfar: Optional[float] = 0.0

    # Lot / building
    lotarea: Optional[float] = 0.0
    bldgarea: Optional[float] = 0.0
    builtfar: Optional[float] = 0.0
    numfloors: Optional[float] = None
    unitsres: Optional[int] = None
    yearbuilt: Optional[int] = None

    # Ownership / classification
    ownername: str = ""
    ownertype: Optional[str] = None
    landuse: str = ""
    bldgclass: Optional[str] = None

    # Assessed values (context for valuation)
    assesstot: Optional[float] = None
    assessland: Optional[float] = None


class ComparableSale(BaseModel):
    """A single arm's-length comparable DEED sale from ACRIS."""

    document_id: str
    address: str
    sale_date: str
    sale_price: float
    block: str
    lot: str
    bbl: str
    acris_url: str
    notes: str = ""
    citation: str = ""


# ---------------------------------------------------------------------------
# Typed exceptions
# ---------------------------------------------------------------------------
class GeocodingError(Exception):
    """The address could not be geocoded to a valid NYC BBL."""


class PLUTONotFoundError(Exception):
    """The BBL was not found in the PLUTO dataset."""


class InsufficientCompsError(Exception):
    """Fewer than the minimum number of comparable sales were found."""


class ClaudeAPIError(Exception):
    """The Claude API call failed."""
