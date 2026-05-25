"""Heuristic suggested questions for Mentor tab (no extra LLM call)."""

from __future__ import annotations

from typing import Any

from memory.portfolio import compute_aesthetic_summary

HOBBYIST_DEFAULTS = [
    "How am I doing so far?",
    "Show me themes from my recent critiques.",
    "What's distinctive about my work?",
]

WORKING_PRO_DEFAULTS = [
    "Which of my recent photos are strongest for print sales?",
    "What patterns do you see across my portfolio?",
    "How can I improve consistency for my shop listings?",
]


def suggest_mentor_questions(
    *,
    persona: str = "hobbyist",
    user_id: str | None = None,
) -> dict[str, Any]:
    profile = compute_aesthetic_summary(user_id=user_id)
    count = int(profile.get("photoCount") or 0)
    tags = profile.get("dominantTags") or []
    avgs = profile.get("averageScores") or {}
    consistency = profile.get("stylisticConsistencyScore")

    questions: list[str] = []

    if count == 0:
        base = WORKING_PRO_DEFAULTS if persona == "working_pro" else HOBBYIST_DEFAULTS
        return {"persona": persona, "questions": base, "source": "default"}

    if count < 4:
        questions.append("What should I focus on as I build my first portfolio entries?")

    if tags:
        label = tags[0].replace("_", " ")
        questions.append(f"What does my '{label}' theme say about my style?")

    weakest = None
    weakest_val = 11.0
    for key, label in (
        ("composition", "composition"),
        ("lighting", "lighting"),
        ("technique", "technique"),
    ):
        v = avgs.get(key)
        if v is not None and float(v) < weakest_val:
            weakest_val = float(v)
            weakest = label

    if weakest and weakest_val < 6.5:
        questions.append(f"How can I improve my {weakest} scores on the next shoot?")
    elif weakest and weakest_val >= 7.5:
        questions.append(f"How do I push my strong {weakest} even further?")

    if consistency is not None and float(consistency) < 0.55:
        questions.append("Why do my scores vary so much between shoots?")
    elif consistency is not None and float(consistency) >= 0.75:
        questions.append("What's working well in my consistent style lately?")

    if persona == "working_pro":
        questions.append("Which portfolio shots are ready for a print listing draft?")
        questions.append("How can I make my shop listings feel more cohesive?")
    else:
        questions.append("What practice assignment would help me most right now?")
        questions.append("How am I progressing compared to my last few uploads?")

    # Dedupe while preserving order
    seen: set[str] = set()
    unique: list[str] = []
    for q in questions:
        if q not in seen:
            seen.add(q)
            unique.append(q)

    defaults = WORKING_PRO_DEFAULTS if persona == "working_pro" else HOBBYIST_DEFAULTS
    while len(unique) < 3:
        for d in defaults:
            if d not in seen:
                unique.append(d)
                seen.add(d)
            if len(unique) >= 3:
                break

    return {
        "persona": persona,
        "questions": unique[:4],
        "source": "portfolio",
        "photoCount": count,
    }
