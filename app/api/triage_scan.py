"""Deterministic triage scan for demo HITL (creates pending_approvals without LLM wait)."""

from __future__ import annotations

from typing import Any

from datetime import datetime, timezone

from bson import ObjectId

from memory.assignments import _resolve_user_id
from memory.db import get_db
from memory.pending_approvals import list_pending
from sub_agents.tools import triage_tools


def _dedupe_key_for_entry(uid: ObjectId, entry_id: str) -> str:
    """One Organize proposal per logical shoot (parity with print_sales_scan)."""
    try:
        doc = get_db().portfolio_entries.find_one(
            {"_id": ObjectId(entry_id), "user_id": uid},
            projection={"shoot_id": 1, "image_url": 1, "thumbnail_url": 1},
        )
    except Exception:
        return f"entry:{entry_id}"
    if not doc:
        return f"entry:{entry_id}"
    shoot = doc.get("shoot_id")
    if shoot:
        return f"shoot:{shoot}"
    image = doc.get("image_url") or doc.get("thumbnail_url") or ""
    if image:
        return f"image:{image}"
    return f"entry:{entry_id}"


def _dedupe_key_for_shoot(shoot_id: str | None, fallback_entry_id: str) -> str:
    if shoot_id:
        return f"shoot:{shoot_id}"
    return f"entry:{fallback_entry_id}"


def _supersede_pending_triage(uid) -> int:
    """Clear old pending triage cards so a new scan does not stack duplicates."""
    result = get_db().pending_approvals.update_many(
        {"user_id": uid, "agent_name": "triage", "status": "pending"},
        {
            "$set": {
                "status": "rejected",
                "user_decision": {
                    "action": "reject",
                    "override_payload": None,
                    "decided_at": datetime.now(timezone.utc),
                },
            }
        },
    )
    return result.modified_count


def run_triage_scan(user_id: str | None = None) -> dict[str, Any]:
    """
    Run Triage tooling directly and ensure at least one pending proposal exists.
    Used by web Triage tab for reliable demo; agentic path uses /api/v1/agent/chat.
    """
    uid = _resolve_user_id(user_id)
    if not uid:
        raise ValueError("Set DEMO_USER_ID in .env")

    superseded = _supersede_pending_triage(uid)

    clusters = triage_tools.cluster_portfolio_by_embedding(str(uid), k=5)
    duplicates = triage_tools.find_duplicate_portfolio_entries(str(uid), limit=5)
    gems = triage_tools.surface_top_scoring_untouched_photos(str(uid), limit=3)

    proposals: list[dict[str, Any]] = []
    seen_keys: set[str] = set()

    def _try_propose(key: str, factory) -> None:
        if key in seen_keys:
            return
        seen_keys.add(key)
        proposals.append(factory())

    # Near-duplicates first (clearer demo than bulk tag on a broad cluster).
    for dup in (duplicates.get("candidates") or [])[:3]:
        ids = dup.get("entryIds") or []
        if len(ids) >= 2:
            target = ids[-1]
            key = _dedupe_key_for_shoot(dup.get("shootId"), target)
            _try_propose(
                key,
                lambda t=target, n=len(ids): triage_tools.propose_photo_deletion(
                    t,
                    reasoning=(
                        f"This shoot has {n} portfolio copies of the same session; "
                        "removing the weakest duplicate keeps one frame for memory and search."
                    ),
                ),
            )

    cluster_list = clusters.get("clusters") or []
    if cluster_list:
        top = cluster_list[0]
        entry_ids = top.get("entryIds") or []
        if entry_ids:
            lead = entry_ids[0]
            key = _dedupe_key_for_entry(uid, lead)
            _try_propose(
                key,
                lambda: triage_tools.propose_bulk_tag_application(
                    entry_ids[:5],
                    tags=[top.get("label", "portfolio"), "triage_reviewed"],
                    reasoning=(
                        f"Triage clustered {top.get('count', 0)} photos under '{top.get('label')}'. "
                        "Harmonizing tags improves Memory search and aesthetic profile."
                    ),
                ),
            )

    for photo in (gems.get("photos") or [])[:1]:
        pid = photo.get("id")
        if pid:
            key = _dedupe_key_for_entry(uid, pid)
            _try_propose(
                key,
                lambda p=pid, score=photo.get("averageScore"): triage_tools.propose_bulk_tag_application(
                    [p],
                    tags=["portfolio_gem", "high_score"],
                    reasoning=(
                        f"Strong score ({score}) but no tags yet — "
                        "mark as a portfolio gem for Memory and Print Sales."
                    ),
                ),
            )

    pending = list_pending(str(uid), status="pending", agent_name="triage")

    return {
        "clusters": cluster_list,
        "duplicateCandidates": duplicates.get("candidates") or [],
        "untaggedGems": gems.get("photos") or [],
        "proposalsCreated": proposals,
        "pending": pending,
        "supersededPending": superseded,
    }
