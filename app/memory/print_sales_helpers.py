"""Shared print-sales dedupe and portfolio linkage helpers."""

from __future__ import annotations

from typing import Any

from bson import ObjectId

from memory.db import get_db


def _portfolio_entry_ids_for_shoot(uid: ObjectId, shoot_id: ObjectId) -> list[str]:
    return [
        str(doc["_id"])
        for doc in get_db().portfolio_entries.find(
            {"user_id": uid, "shoot_id": shoot_id},
            {"_id": 1},
        )
    ]


def listing_exists_for_portfolio_entry(uid: ObjectId, entry_id: str) -> bool:
    """True if this entry — or another row from the same shoot — is already listed."""
    coll = get_db().print_sales
    if coll.find_one(
        {"user_id": uid, "portfolio_entry_id": str(entry_id), "status": "listed"}
    ):
        return True

    try:
        entry = get_db().portfolio_entries.find_one({"_id": ObjectId(entry_id), "user_id": uid})
    except Exception:
        entry = None
    if not entry or not entry.get("shoot_id"):
        return False

    sibling_ids = _portfolio_entry_ids_for_shoot(uid, entry["shoot_id"])
    if not sibling_ids:
        return False
    return (
        coll.find_one(
            {
                "user_id": uid,
                "portfolio_entry_id": {"$in": sibling_ids},
                "status": "listed",
            }
        )
        is not None
    )


def dedupe_key_for_listing(doc: dict[str, Any], entry: dict[str, Any] | None) -> str:
    """One card per logical upload (shoot), else per portfolio row."""
    if entry and entry.get("shoot_id"):
        return f"shoot:{entry['shoot_id']}"
    entry_id = doc.get("portfolio_entry_id")
    return f"entry:{entry_id}" if entry_id else f"listing:{doc['_id']}"


def dedupe_listed_sales(docs: list[dict[str, Any]], uid: ObjectId) -> list[dict[str, Any]]:
    """Keep the newest listed row per shoot / portfolio entry."""
    portfolio = get_db().portfolio_entries
    best: dict[str, dict[str, Any]] = {}
    for doc in docs:
        entry_id = doc.get("portfolio_entry_id")
        entry = None
        if entry_id:
            try:
                entry = portfolio.find_one({"_id": ObjectId(entry_id), "user_id": uid})
            except Exception:
                entry = None
        key = dedupe_key_for_listing(doc, entry)
        prev = best.get(key)
        if not prev:
            best[key] = doc
            continue
        prev_at = prev.get("listed_at") or prev.get("created_at")
        cur_at = doc.get("listed_at") or doc.get("created_at")
        if cur_at and (not prev_at or cur_at >= prev_at):
            best[key] = doc
    return list(best.values())
