"""Shared async HTTP helper with retry + exponential backoff for NYC APIs."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Optional

import httpx

logger = logging.getLogger(__name__)


async def get_with_retry(
    client: httpx.AsyncClient,
    url: str,
    params: Optional[dict] = None,
    retries: int = 3,
    base_delay: float = 0.5,
) -> Any:
    """GET a URL with retries and exponential backoff. Returns parsed JSON."""
    last_exc: Optional[Exception] = None
    for attempt in range(retries):
        try:
            resp = await client.get(url, params=params, timeout=20.0)
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:  # noqa: BLE001 - we re-raise after retries
            last_exc = exc
            wait = base_delay * (2 ** attempt)
            logger.warning(
                "Request to %s failed (attempt %d/%d): %s — retrying in %.1fs",
                url, attempt + 1, retries, exc, wait,
            )
            await asyncio.sleep(wait)
    logger.error("Request to %s failed after %d attempts: %s", url, retries, last_exc)
    raise last_exc  # type: ignore[misc]
