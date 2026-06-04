"""ACRIS comparable-sales fetcher.

Strategy:
  1. Query ACRIS Real Property Legals (8h5j-fqxa) for all records on a
     borough+block to collect document_ids and their street addresses.
  2. Query ACRIS Real Property Master (bnx9-e6tj) for those document_ids,
     filtering to arm's-length DEED transactions (document_amt > $10k),
     ordered by most recent.
  3. If fewer than 3 comps found, expand to adjacent blocks.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Dict, List

import httpx

from .models import ComparableSale
from .http import get_with_retry

logger = logging.getLogger(__name__)

LEGALS_URL = "https://data.cityofnewyork.us/resource/8h5j-fqxa.json"
MASTER_URL = "https://data.cityofnewyork.us/resource/bnx9-e6tj.json"
ACRIS_RECORD_URL = "https://a836-acris.nyc.gov/DS/DocumentSearch/DocumentDetail?doc_id={doc_id}"

MIN_PRICE = 10000


def _build_bbl(borough_code: str, block: str, lot: str) -> str:
    try:
        return f"{borough_code}{int(block):05d}{int(lot):04d}"
    except (ValueError, TypeError):
        return ""


async def _fetch_block_legals(
    client: httpx.AsyncClient, borough_code: str, block: str
) -> Dict[str, dict]:
    """Return {document_id: legal_record} for a single borough+block."""
    params = {
        "borough": borough_code,
        "block": str(int(block)),
        "$limit": "200",
        "$select": "document_id,street_number,street_name,block,lot",
    }
    rows = await get_with_retry(client, LEGALS_URL, params=params)
    docmap: Dict[str, dict] = {}
    for r in rows or []:
        docmap.setdefault(r["document_id"], r)
    return docmap


async def _fetch_deeds(
    client: httpx.AsyncClient, doc_ids: List[str], limit: int = 10
) -> List[dict]:
    """Fetch arm's-length DEED master records for a list of document_ids."""
    if not doc_ids:
        return []
    # Socrata `in()` clause — cap to avoid overly long query strings which hang the API
    chunk = doc_ids[:40]
    inlist = ",".join(f"'{d}'" for d in chunk)
    where = (
        f"doc_type='DEED' AND document_amt > {MIN_PRICE} "
        f"AND document_id in ({inlist})"
    )
    params = {
        "$where": where,
        "$order": "recorded_datetime DESC",
        "$limit": str(limit),
    }
    return await get_with_retry(client, MASTER_URL, params=params) or []


def _deed_to_comp(
    deed: dict, leg: dict, borough_code: str, blk: int, subject_block: int
) -> ComparableSale | None:
    """Convert an ACRIS deed master row + its legal record into a ComparableSale."""
    doc_id = deed["document_id"]
    price = float(deed.get("document_amt", 0) or 0)
    if price <= MIN_PRICE:
        return None
    street = f"{leg.get('street_number', '')} {leg.get('street_name', '')}".strip()
    comp_block = leg.get("block", str(blk))
    comp_lot = leg.get("lot", "")
    return ComparableSale(
        document_id=doc_id,
        address=street or "Address not recorded",
        sale_date=(deed.get("recorded_datetime") or "")[:10],
        sale_price=price,
        block=str(comp_block),
        lot=str(comp_lot),
        bbl=_build_bbl(borough_code, comp_block, comp_lot),
        acris_url=ACRIS_RECORD_URL.format(doc_id=doc_id),
        notes="Same block" if blk == subject_block else f"Adjacent block {blk}",
        citation=f"ACRIS document {doc_id}",
    )


def _blocks_to_search(block_int: int) -> List[int]:
    """Same block first, then nearest adjacent blocks."""
    blocks = [block_int]
    for delta in (1, -1, 2, -2):
        if block_int + delta > 0:
            blocks.append(block_int + delta)
    return blocks


async def fetch_comparables(
    client: httpx.AsyncClient,
    borough_code: str,
    block: str,
    subject_lot: str,
    max_comps: int = 8,
) -> List[ComparableSale]:
    """Fetch recent arm's-length comparable DEED sales near the subject lot."""
    block_int = int(block)
    comps: List[ComparableSale] = []
    seen_docs: set = set()

    for blk in _blocks_to_search(block_int):
        legals = await _fetch_block_legals(client, borough_code, str(blk))
        deeds = await _fetch_deeds(client, list(legals.keys()), limit=max_comps * 2)

        for d in deeds:
            doc_id = d["document_id"]
            if doc_id in seen_docs:
                continue
            seen_docs.add(doc_id)
            comp = _deed_to_comp(d, legals.get(doc_id, {}), borough_code, blk, block_int)
            if comp:
                comps.append(comp)

        await asyncio.sleep(0.5)  # courtesy delay between block pagination calls
        if (len(comps) >= 3 and blk == block_int) or len(comps) >= max_comps:
            break

    comps.sort(key=lambda c: c.sale_date, reverse=True)
    return comps[:max_comps]
