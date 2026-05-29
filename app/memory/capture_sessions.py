"""REST-backed capture sessions for live field coaching (Phase 3.5)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from bson import ObjectId

from memory.assignments import _resolve_user_id
from memory.db import get_db

SESSION_MAX_MINUTES = 15


def _as_utc(dt: datetime) -> datetime:
    """MongoDB may return naive UTC datetimes — normalize before comparisons."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def create_capture_session(
    *,
    user_id: str | None = None,
    location_description: str = "",
    assignment_id: str | None = None,
    persona: str = "hobbyist",
) -> dict[str, Any]:
    uid = _resolve_user_id(user_id)
    if not uid:
        raise ValueError("Set DEMO_USER_ID or pass user_id for capture sessions")

    doc: dict[str, Any] = {
        "user_id": uid,
        "started_at": datetime.now(timezone.utc),
        "ended_at": None,
        "location_description": location_description.strip(),
        "persona": persona,
        "voice_interactions": [],
        "frame_count": 0,
    }
    if assignment_id:
        doc["assignment_id"] = ObjectId(assignment_id)

    result = get_db().capture_sessions.insert_one(doc)
    return {"sessionId": str(result.inserted_id), "persona": persona}


def get_capture_session(session_id: str, user_id: str | None = None) -> dict[str, Any]:
    uid = _resolve_user_id(user_id)
    if not uid:
        raise ValueError("No user for capture session")
    doc = get_db().capture_sessions.find_one(
        {"_id": ObjectId(session_id), "user_id": uid}
    )
    if not doc:
        raise ValueError("Capture session not found")
    return doc


def assert_active_session(session_id: str, user_id: str | None = None) -> dict[str, Any]:
    doc = get_capture_session(session_id, user_id=user_id)
    if doc.get("ended_at"):
        raise ValueError("Capture session already ended")
    started = doc.get("started_at")
    if isinstance(started, datetime):
        started_utc = _as_utc(started)
        if datetime.now(timezone.utc) - started_utc > timedelta(minutes=SESSION_MAX_MINUTES):
            raise ValueError("Capture session expired (15 minute limit)")
    return doc


def record_frame(session_id: str, user_id: str | None = None) -> None:
    uid = _resolve_user_id(user_id)
    get_db().capture_sessions.update_one(
        {"_id": ObjectId(session_id), "user_id": uid},
        {"$inc": {"frame_count": 1}},
    )


def end_capture_session(session_id: str, user_id: str | None = None) -> dict[str, Any]:
    doc = assert_active_session(session_id, user_id=user_id)
    uid = doc["user_id"]
    ended = datetime.now(timezone.utc)
    get_db().capture_sessions.update_one(
        {"_id": ObjectId(session_id), "user_id": uid},
        {"$set": {"ended_at": ended}},
    )
    return {
        "sessionId": session_id,
        "endedAt": ended.isoformat(),
        "frameCount": int(doc.get("frame_count", 0)),
    }
