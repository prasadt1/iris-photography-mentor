from api.mentor_suggestions import suggest_mentor_questions


def test_suggest_mentor_questions_empty_portfolio(monkeypatch):
    monkeypatch.setattr(
        "api.mentor_suggestions.compute_aesthetic_summary",
        lambda **kwargs: {
            "photoCount": 0,
            "dominantTags": [],
            "averageScores": {},
            "stylisticConsistencyScore": None,
        },
    )
    out = suggest_mentor_questions(persona="hobbyist")
    assert out["source"] == "default"
    assert len(out["questions"]) == 3


def test_suggest_mentor_questions_from_portfolio(monkeypatch):
    monkeypatch.setattr(
        "api.mentor_suggestions.compute_aesthetic_summary",
        lambda **kwargs: {
            "photoCount": 8,
            "dominantTags": ["portrait_natural_light"],
            "averageScores": {"composition": 5.2, "lighting": 7.1, "technique": 6.0},
            "stylisticConsistencyScore": 0.48,
        },
    )
    out = suggest_mentor_questions(persona="hobbyist")
    assert out["source"] == "portfolio"
    assert any("portrait" in q.lower() or "natural" in q.lower() for q in out["questions"])
    assert len(out["questions"]) >= 3
