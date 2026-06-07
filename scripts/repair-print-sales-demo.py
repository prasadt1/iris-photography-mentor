#!/usr/bin/env python3
"""Repair demo print-sales listings whose portfolio photos were deleted.

Relinks orphaned rows to the best live portfolio match (by tag/title heuristics)
so Print Sales screenshots show thumbnails again.

Usage:
  python3 scripts/repair-print-sales-demo.py
  python3 scripts/repair-print-sales-demo.py --dry-run
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from datetime import datetime, timezone

from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

try:
    from pymongo import MongoClient
except ImportError:
    print("Install: pip install pymongo python-dotenv", file=sys.stderr)
    sys.exit(1)

URI = os.environ.get("MONGODB_URI")
DB_NAME = os.environ.get("MONGODB_DB_NAME", "practice_companion")
DEMO_HEX = os.environ.get("DEMO_USER_ID", "6577a1f2b3c4d5e6f7a8b9c0")
LISTED_TAG = "listed_for_sale"

# title/tag substring → preferred aesthetic tag on a live portfolio row
MATCH_HINTS: list[tuple[str, str]] = [
    ("wildlife", "wildlife_photography"),
    ("eagle", "wildlife_photography"),
    ("deer", "wildlife_photography"),
    ("still life", "food_photography"),
    ("minimalist", "food_photography"),
    ("landscape", "landscape"),
    ("waterfall", "intimate_landscape"),
    ("sunset", "sunset"),
    ("equine", "equine_photography"),
    ("horse", "equine_photography"),
]


def _avg_score(scores: dict) -> float:
    vals = [scores.get(k) for k in ("composition", "lighting", "technique", "creativity", "subject_impact")]
    nums = [float(v) for v in vals if isinstance(v, (int, float))]
    return sum(nums) / len(nums) if nums else 0.0


def _hint_for_listing(title: str, description: str) -> str | None:
    blob = f"{title} {description}".lower()
    for needle, tag in MATCH_HINTS:
        if needle in blob:
            return tag
    return None


def _pick_replacement(
    entries: list[dict],
    *,
    hint: str | None,
    exclude_entry_ids: set[str],
    exclude_shoot_ids: set[str],
) -> dict | None:
    candidates = [
        e
        for e in entries
        if str(e["_id"]) not in exclude_entry_ids
        and str(e.get("shoot_id", "")) not in exclude_shoot_ids
    ]
    if not candidates:
        return None

    if hint:
        tagged = [e for e in candidates if hint in (e.get("aesthetic_tags") or [])]
        if tagged:
            candidates = tagged

    return max(candidates, key=lambda e: _avg_score(e.get("scores") or {}))


def _listing_copy(entry: dict, marketplace: str = "etsy") -> dict[str, str | float]:
    tags = entry.get("aesthetic_tags") or []
    scene = (entry.get("scene_description") or "Photograph")[:120]
    tag_label = tags[0].replace("_", " ") if tags else "photography"
    return {
        "marketplace": marketplace,
        "title": f"Fine art print — {tag_label}",
        "description": f"Archival print based on: {scene}",
        "list_price": 45.0,
        "currency": "USD",
    }


def repair(*, dry_run: bool) -> int:
    if not URI:
        print("MONGODB_URI not set", file=sys.stderr)
        return 1

    uid = ObjectId(DEMO_HEX)
    client = MongoClient(URI, serverSelectionTimeoutMS=15000)
    db = client[DB_NAME]

    entries = list(db.portfolio_entries.find({"user_id": uid}))
    listings = list(db.print_sales.find({"user_id": uid, "status": "listed"}))

    used_entry_ids: set[str] = set()
    used_shoot_ids: set[str] = set()
    repaired = 0
    removed = 0

    for listing in listings:
        entry_id = str(listing.get("portfolio_entry_id", ""))
        entry = db.portfolio_entries.find_one({"_id": ObjectId(entry_id), "user_id": uid}) if entry_id else None
        if entry:
            used_entry_ids.add(entry_id)
            if entry.get("shoot_id"):
                used_shoot_ids.add(str(entry["shoot_id"]))
            continue

        hint = _hint_for_listing(listing.get("title", ""), listing.get("description", ""))
        replacement = _pick_replacement(
            entries,
            hint=hint,
            exclude_entry_ids=used_entry_ids,
            exclude_shoot_ids=used_shoot_ids,
        )
        if not replacement:
            print(f"  remove orphan (no replacement): {listing.get('title', listing['_id'])}")
            if not dry_run:
                db.print_sales.update_one(
                    {"_id": listing["_id"]},
                    {"$set": {"status": "removed", "removed_at": datetime.now(timezone.utc)}},
                )
            removed += 1
            continue

        new_id = str(replacement["_id"])
        copy = _listing_copy(replacement, marketplace=listing.get("marketplace", "etsy"))
        print(f"  relink: {listing.get('title', '')[:50]}")
        print(f"    → {new_id} ({(replacement.get('scene_description') or '')[:60]}…)")

        if not dry_run:
            db.print_sales.update_one(
                {"_id": listing["_id"]},
                {
                    "$set": {
                        "portfolio_entry_id": new_id,
                        "title": copy["title"],
                        "description": copy["description"],
                        "list_price": copy["list_price"],
                        "currency": copy["currency"],
                    }
                },
            )
            db.portfolio_entries.update_one(
                {"_id": replacement["_id"]},
                {"$addToSet": {"user_tags": LISTED_TAG}},
            )

        used_entry_ids.add(new_id)
        if replacement.get("shoot_id"):
            used_shoot_ids.add(str(replacement["shoot_id"]))
        repaired += 1

    print(f"\nDone — relinked {repaired}, removed {removed}" + (" (dry run)" if dry_run else ""))
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Repair orphaned demo print-sales listings")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    raise SystemExit(repair(dry_run=args.dry_run))


if __name__ == "__main__":
    main()
