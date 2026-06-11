#!/usr/bin/env python3
"""Reset print-sales demo state so you can re-record the HITL approve flow.

Marks listed rows as removed, strips listed_for_sale tags, rejects pending
print_sales drafts, then optionally re-seeds fresh pending proposals.

Usage:
  python3 scripts/reset-print-sales-demo.py
  python3 scripts/reset-print-sales-demo.py --user 54026a590045b7b3a8673033
  python3 scripts/reset-print-sales-demo.py --no-seed   # reset only
  python3 scripts/reset-print-sales-demo.py --dry-run
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "app"))

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None  # type: ignore

if load_dotenv:
    load_dotenv(ROOT / ".env")

REAL_USER_HEX = "54026a590045b7b3a8673033"
LISTED_TAG = "listed_for_sale"


def reset(*, user_hex: str, dry_run: bool) -> dict[str, int]:
    from bson import ObjectId
    from pymongo import MongoClient

    uri = os.environ.get("MONGODB_URI")
    if not uri:
        print("MONGODB_URI not set", file=sys.stderr)
        sys.exit(1)

    uid = ObjectId(user_hex)
    db = MongoClient(uri)[os.environ.get("MONGODB_DB_NAME", "practice_companion")]
    now = datetime.now(timezone.utc)

    listed = list(db.print_sales.find({"user_id": uid, "status": "listed"}))
    pending = list(
        db.pending_approvals.find(
            {"user_id": uid, "agent_name": "print_sales", "status": "pending"}
        )
    )
    tagged = list(
        db.portfolio_entries.find({"user_id": uid, "user_tags": LISTED_TAG}, {"_id": 1})
    )

    print(f"User {user_hex}:")
    print(f"  listed print_sales rows: {len(listed)}")
    print(f"  pending print drafts:    {len(pending)}")
    print(f"  portfolio listed tags:   {len(tagged)}")

    if dry_run:
        for row in listed:
            print(f"    would unlist: {row.get('portfolio_entry_id')} — {row.get('title', '')[:50]}")
        return {
            "listed": len(listed),
            "pending": len(pending),
            "tagged": len(tagged),
        }

    if listed:
        result = db.print_sales.update_many(
            {"user_id": uid, "status": "listed"},
            {"$set": {"status": "removed", "removed_at": now}},
        )
        print(f"  → marked {result.modified_count} listing(s) as removed")

    if pending:
        result = db.pending_approvals.update_many(
            {"user_id": uid, "agent_name": "print_sales", "status": "pending"},
            {
                "$set": {
                    "status": "rejected",
                    "user_decision": {
                        "action": "reject",
                        "override_payload": None,
                        "decided_at": now,
                        "reason": "demo_reset",
                    },
                }
            },
        )
        print(f"  → rejected {result.modified_count} pending draft(s)")

    if tagged:
        result = db.portfolio_entries.update_many(
            {"user_id": uid, "user_tags": LISTED_TAG},
            {"$pull": {"user_tags": LISTED_TAG}},
        )
        print(f"  → cleared listed_for_sale tag on {result.modified_count} photo(s)")

    return {
        "listed": len(listed),
        "pending": len(pending),
        "tagged": len(tagged),
    }


def seed(*, user_hex: str, limit: int) -> None:
    from api.print_sales_scan import run_print_sales_scan

    result = run_print_sales_scan(user_hex, marketplace="etsy", limit=limit)
    created = result.get("proposalsCreated") or []
    pending = result.get("pending") or {}
    print(f"\nSeeded {len(created)} draft(s); {pending.get('total', 0)} pending total.")
    for row in created:
        payload = (row.get("proposed_action") or {}).get("payload") or {}
        price = payload.get("list_price") or payload.get("suggestedListPrice")
        title = payload.get("title", "")
        print(f"  {row.get('pendingApprovalId')} — {title[:55]} @ ${price}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Reset print-sales demo for re-recording")
    parser.add_argument("--user", default=os.environ.get("PRINT_SALES_USER_ID", REAL_USER_HEX))
    parser.add_argument("--limit", type=int, default=4, help="Pending drafts to create after reset")
    parser.add_argument("--no-seed", action="store_true", help="Reset only; do not create new drafts")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    reset(user_hex=args.user, dry_run=args.dry_run)
    if args.dry_run or args.no_seed:
        return
    seed(user_hex=args.user, limit=args.limit)


if __name__ == "__main__":
    main()
