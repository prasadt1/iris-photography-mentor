#!/usr/bin/env python3
"""Create Print Sales HITL listing drafts for demo recording.

Replaces any stale pending print_sales rows and drafts proposals from the
highest-scoring portfolio photos (camper van 8.6, glacier 8.4, etc.).

Usage:
  python3 scripts/seed-print-sales-pending.py
  python3 scripts/seed-print-sales-pending.py --user 54026a590045b7b3a8673033
  python3 scripts/seed-print-sales-pending.py --dry-run
"""
from __future__ import annotations

import argparse
import os
import sys
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


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Print Sales pending drafts")
    parser.add_argument("--user", default=os.environ.get("PRINT_SALES_USER_ID", REAL_USER_HEX))
    parser.add_argument("--marketplace", default="etsy")
    parser.add_argument("--limit", type=int, default=4)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.dry_run:
        from pymongo import MongoClient

        uri = os.environ.get("MONGODB_URI")
        if not uri:
            print("MONGODB_URI not set", file=sys.stderr)
            sys.exit(1)
        from bson import ObjectId

        db = MongoClient(uri)[os.environ.get("MONGODB_DB_NAME", "practice_companion")]
        uid = ObjectId(args.user)
        n = db.portfolio_entries.count_documents({"user_id": uid})
        pending = db.pending_approvals.count_documents(
            {"user_id": uid, "agent_name": "print_sales", "status": "pending"}
        )
        print(f"User {args.user}: {n} portfolio entries, {pending} pending print drafts")
        return

    from api.print_sales_scan import run_print_sales_scan

    result = run_print_sales_scan(args.user, marketplace=args.marketplace, limit=args.limit)
    created = result.get("proposalsCreated") or []
    pending = result.get("pending") or {}
    print(f"Created {len(created)} draft(s); {pending.get('total', 0)} pending total.")
    if result.get("supersededPending"):
        print(f"Superseded {result['supersededPending']} old pending row(s).")
    for row in created:
        print(f"  {row.get('pendingApprovalId')} ({row.get('status')})")


if __name__ == "__main__":
    main()
