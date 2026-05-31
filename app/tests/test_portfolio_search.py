"""Portfolio library text search helpers."""

from orchestrator.memory_tools import _portfolio_text_search_filter, _search_terms


def test_search_terms_animal_expands_synonyms() -> None:
    terms = _search_terms("animal")
    assert "animal" in terms
    assert "deer" in terms
    assert "lion" in terms


def test_portfolio_text_search_includes_tags() -> None:
    filt = _portfolio_text_search_filter(["animal"], {"user_id": "abc"})
    fields = {next(iter(clause.keys())) for clause in filt["$or"]}
    assert "aesthetic_tags" in fields
    assert "scene_description" in fields
