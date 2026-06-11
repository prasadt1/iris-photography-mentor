#!/usr/bin/env python3
"""Seed golden-hour / tree stock entries into the REAL recording account's library.

Purpose: richer contact sheet + trend line for web/iOS Home — keeps your 3 real
photos untouched (tree, glacier, oak). Stock rows use fixed _ids only.

Guardrails:
- Targets real Google account (54026a590045b7b3a8673033), NOT the demo user.
- No embeddings — excluded from "Similar in your library" vector search.
- Dated BEFORE your field tree so the tree stays newest + hero.
- scene_description always matches the Unsplash image (verified visually).
- Scores are synthetic labels on stock rows only — see SCORE IMPACT below.

SCORE IMPACT (what changes vs what doesn't):
- Your tree / glacier / oak critique scores: UNCHANGED (separate documents).
- Home "Avg score" / aesthetic profile averages: shift slightly (more entries).
- Home hero: your recent golden-hour tree still wins (hero picker logic).
- VO numbers for field demo (7.5 / 6.5): still only from the real tree critique.

Idempotent: fixed _ids; re-run skips existing. --remove deletes all stock.
--refresh updates metadata on existing stock rows without touching real photos.

Image URLs: Unsplash (https://unsplash.com/license)
"""
from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta, timezone

try:
    from bson import ObjectId
    from dotenv import load_dotenv
    from pymongo import MongoClient
except ImportError:
    print("Install: python3 -m pip install pymongo python-dotenv", file=sys.stderr)
    sys.exit(1)

load_dotenv()

URI = os.environ.get("MONGODB_URI")
DB_NAME = os.environ.get("MONGODB_DB_NAME", "practice_companion")

REAL_USER_ID = ObjectId("54026a590045b7b3a8673033")
STOCK_SHOOT_ID = ObjectId("66660601bbbbbbbbbbbbbb01")

_UNSPLASH = "https://images.unsplash.com/photo-{id}?w=900&q=80"

# 8 stock rows — image + scene_description verified to match (Jun 2026).
_FIXTURES = [
    {
        "_id": ObjectId("66660601aaaaaaaaaaaaaa01"),
        "photo": "1732937401518-cd7931e24896",
        "days_ago": 28,
        "scores": {"composition": 5.4, "lighting": 6.2, "technique": 5.6, "creativity": 5.3, "subject_impact": 5.5},
        "tags": ["landscape", "trees", "golden_hour"],
        "scene": "A lone tree on a grassy hill, backlit by low golden sun through the leaves.",
    },
    {
        "_id": ObjectId("66660601aaaaaaaaaaaaaa02"),
        "photo": "1441974231531-c6227db76b6e",
        "days_ago": 24,
        "scores": {"composition": 5.6, "lighting": 6.4, "technique": 5.9, "creativity": 5.2, "subject_impact": 5.5},
        "tags": ["landscape", "trees", "golden_hour"],
        "scene": "A forest path with warm light filtering through tall trees.",
    },
    {
        "_id": ObjectId("66660601aaaaaaaaaaaaaa03"),
        "photo": "1722092578469-e8d7116080ea",
        "days_ago": 20,
        "scores": {"composition": 6.0, "lighting": 6.9, "technique": 6.0, "creativity": 5.7, "subject_impact": 6.0},
        "tags": ["landscape", "trees", "golden_hour", "forest"],
        "scene": "Sunlit treetops against misty mountains under a stormy sky at golden hour.",
    },
    {
        "_id": ObjectId("66660601aaaaaaaaaaaaaa04"),
        "photo": "1472214103451-9374bd1c798e",
        "days_ago": 17,
        "scores": {"composition": 6.3, "lighting": 6.8, "technique": 6.1, "creativity": 5.8, "subject_impact": 6.0},
        "tags": ["landscape", "golden_hour"],
        "scene": "A green valley with the sun setting between ridgelines.",
    },
    {
        "_id": ObjectId("66660601aaaaaaaaaaaaaa05"),
        "photo": "1705734269616-1e0e90f49505",
        "days_ago": 14,
        "scores": {"composition": 6.1, "lighting": 6.6, "technique": 6.0, "creativity": 5.9, "subject_impact": 6.2},
        "tags": ["landscape", "trees", "golden_hour"],
        "scene": "A large tree in a golden meadow, trunk lit by late-day sun.",
    },
    {
        "_id": ObjectId("66660601aaaaaaaaaaaaaa06"),
        "photo": "1506905925346-21bda4d32df4",
        "days_ago": 11,
        "scores": {"composition": 5.8, "lighting": 6.2, "technique": 6.0, "creativity": 5.6, "subject_impact": 5.9},
        "tags": ["landscape", "mountain", "dusk"],
        "scene": "Snow-capped peaks above a sea of clouds at dusk.",
    },
    {
        "_id": ObjectId("66660601aaaaaaaaaaaaaa07"),
        "photo": "1725974044446-5bd199ed505d",
        "days_ago": 8,
        "scores": {"composition": 6.4, "lighting": 6.8, "technique": 6.2, "creativity": 6.0, "subject_impact": 6.3},
        "tags": ["landscape", "trees", "golden_hour"],
        "scene": "A tree with golden autumn leaves glowing in late sunlight.",
    },
    {
        "_id": ObjectId("66660601aaaaaaaaaaaaaa08"),
        "photo": "1500530855697-b586d89ba3ee",
        "days_ago": 5,
        "scores": {"composition": 6.6, "lighting": 7.0, "technique": 6.3, "creativity": 6.0, "subject_impact": 6.4},
        "tags": ["landscape", "golden_hour", "road_trip"],
        "scene": "A desert road leading toward distant peaks in warm, hazy light.",
    },
    {
        "_id": ObjectId("66660601aaaaaaaaaaaaaa09"),
        "image_url": (
            "gs://practice-companion-portfolio/originals/"
            "54026a590045b7b3a8673033/stock/cover-hero-van.jpg"
        ),
        "days_ago": 18,
        "hours_ago": 2,
        "scores": {"composition": 8.8, "lighting": 8.8, "technique": 8.4, "creativity": 8.4, "subject_impact": 8.6},
        "tags": ["golden_hour", "leading_lines", "landscape", "road_trip"],
        "scene": (
            "A lone camper trails dust down a desert road as the sun breaks under storm clouds."
        ),
        "glass_box_observations": [
            "Strong leading lines pull the eye toward the warm light on the horizon.",
            "The dust trail adds motion and depth — a clear subject in an open frame.",
        ],
    },
]

STOCK_IDS = [f["_id"] for f in _FIXTURES]


def _image_url(fix: dict) -> str:
    if fix.get("image_url"):
        return fix["image_url"]
    return _UNSPLASH.format(id=fix["photo"])


def _created_at(fix: dict) -> datetime:
    hours = fix.get("hours_ago", 2)
    return datetime.now(timezone.utc) - timedelta(days=fix["days_ago"], hours=hours)


def _glass_box(fix: dict) -> dict:
    observations = fix.get(
        "glass_box_observations",
        [
            "Warm low-angle light defines the subject.",
            "Framing could commit harder to a single dominant subject.",
        ],
    )
    return {
        "observations": observations,
        "reasoning_steps": [],
        "priority_fixes": [],
        "grounding_principles": ["composition.md", "lighting.md"],
    }


def _doc(fix: dict) -> dict:
    url = _image_url(fix)
    return {
        "_id": fix["_id"],
        "user_id": REAL_USER_ID,
        "shoot_id": STOCK_SHOOT_ID,
        "image_url": url,
        "thumbnail_url": url,
        "scores": fix["scores"],
        "scene_description": fix["scene"],
        "colour_notes": "Warm golden-hour palette with soft contrast.",
        "glass_box": _glass_box(fix),
        "aesthetic_tags": fix["tags"],
        "created_at": _created_at(fix),
        # No embedding — vector search uses real uploads only.
    }


def _refresh_fields(fix: dict) -> dict:
    url = _image_url(fix)
    return {
        "image_url": url,
        "thumbnail_url": url,
        "scores": fix["scores"],
        "scene_description": fix["scene"],
        "aesthetic_tags": fix["tags"],
        "created_at": _created_at(fix),
        "colour_notes": "Warm golden-hour palette with soft contrast.",
        "glass_box": _glass_box(fix),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed golden-hour stock into the real account library")
    parser.add_argument("--remove", action="store_true", help="Delete all stock entries (fixed ids only)")
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Update metadata/images on existing stock rows (fixes bad captions)",
    )
    args = parser.parse_args()

    if not URI:
        print("MONGODB_URI not set", file=sys.stderr)
        sys.exit(1)

    client = MongoClient(URI, serverSelectionTimeoutMS=15000)
    client.admin.command("ping")
    coll = client[DB_NAME].portfolio_entries

    if args.remove:
        res = coll.delete_many({"_id": {"$in": STOCK_IDS}})
        print(f"Removed {res.deleted_count} stock entries.")
        real = coll.count_documents({"user_id": REAL_USER_ID})
        print(f"Library now has {real} entries (real + any non-stock).")
        return

    inserted = 0
    refreshed = 0
    for fix in _FIXTURES:
        existing = coll.find_one({"_id": fix["_id"]}, projection={"_id": 1})
        if existing:
            if args.refresh:
                coll.update_one({"_id": fix["_id"]}, {"$set": _refresh_fields(fix)})
                refreshed += 1
                label = fix.get("photo") or "cover-hero-van"
                print(f"  refreshed: {label}")
            else:
                label = fix.get("photo") or fix.get("image_url", str(fix["_id"]))
                print(f"  exists, skipping: {label}")
            continue
        coll.insert_one(_doc(fix))
        inserted += 1
        label = fix.get("photo") or "cover-hero-van"
        print(f"  inserted: {label} ({fix['days_ago']}d ago)")

    total = coll.count_documents({"user_id": REAL_USER_ID})
    real_only = coll.count_documents({"user_id": REAL_USER_ID, "_id": {"$nin": STOCK_IDS}})
    print(f"\nDone. Inserted {inserted}, refreshed {refreshed}.")
    print(f"Library: {total} total ({real_only} real + {total - real_only} stock).")
    print("Your 3 real photos are untouched.")
    print("Cover camper van (stock 09) stays in library; real uploads win Home hero.")
    print("Undo stock only: python3 scripts/seed-library-stock.py --remove")


if __name__ == "__main__":
    main()
