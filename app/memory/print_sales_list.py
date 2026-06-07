"""Saved print listings (approved HITL) for Print Sales tab."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from bson import ObjectId

from memory.assignments import _resolve_user_id
from memory.db import get_db
from memory.portfolio import _image_url_for_client
from memory.print_sales_helpers import dedupe_listed_sales

LISTED_FOR_SALE_TAG = "listed_for_sale"


def _serialize(
    doc: dict[str, Any],
    *,
    entry: dict[str, Any] | None = None,
) -> dict[str, Any]:
    listed = doc.get("listed_at")
    created = doc.get("created_at")
    thumb = ""
    shoot_id = None
    orphaned = True
    if entry:
        orphaned = False
        shoot_id = str(entry.get("shoot_id", "")) or None
        thumb = entry.get("thumbnail_url") or entry.get("image_url") or ""

    return {
        "id": str(doc["_id"]),
        "portfolioEntryId": str(doc.get("portfolio_entry_id", "")),
        "shootId": shoot_id,
        "imageUrl": _image_url_for_client(thumb) if thumb else None,
        "orphaned": orphaned,
        "marketplace": doc.get("marketplace", "etsy"),
        "title": doc.get("title", ""),
        "description": doc.get("description", ""),
        "listPrice": float(doc.get("list_price") or 0),
        "currency": doc.get("currency", "USD"),
        "status": doc.get("status", "listed"),
        "listedAt": listed.isoformat() if isinstance(listed, datetime) else None,
        "createdAt": created.isoformat() if isinstance(created, datetime) else None,
    }


def list_print_sales(user_id: str | None = None, *, limit: int = 50) -> dict[str, Any]:
    uid = _resolve_user_id(user_id)
    if not uid:
        return {"items": [], "total": 0}

    docs = list(
        get_db()
        .print_sales.find({"user_id": uid, "status": "listed"})
        .sort("listed_at", -1)
        .limit(limit * 3)
    )
    docs = dedupe_listed_sales(docs, uid)
    docs.sort(key=lambda d: d.get("listed_at") or d.get("created_at") or datetime.min, reverse=True)
    docs = docs[:limit]

    portfolio = get_db().portfolio_entries
    items: list[dict[str, Any]] = []
    for doc in docs:
        entry = None
        entry_id = doc.get("portfolio_entry_id")
        if entry_id:
            try:
                entry = portfolio.find_one({"_id": ObjectId(entry_id), "user_id": uid})
            except Exception:
                entry = None
        items.append(_serialize(doc, entry=entry))

    return {"items": items, "total": len(items)}
