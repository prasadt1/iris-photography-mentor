"""Portfolio similar + Atlas Search API wrappers."""

from unittest.mock import MagicMock, patch

from api.portfolio_insights import get_similar_portfolio_photos, search_portfolio_library


@patch("api.portfolio_insights._resolve_user_id")
@patch("api.portfolio_insights.resolve_effective_user_id")
@patch("api.portfolio_insights.vector_search_similar_photos")
@patch("api.portfolio_insights._entry_owned_by_user")
@patch("api.portfolio_insights._enrich_match_ids")
def test_similar_photos_enriches_matches(
    mock_enrich,
    mock_owned,
    mock_vector,
    mock_resolve_eff,
    mock_resolve_uid,
) -> None:
    mock_resolve_eff.return_value = None
    mock_resolve_uid.return_value = "6577a1f2b3c4d5e6f7a8b9c0"
    mock_owned.return_value = {"_id": "abc"}
    mock_vector.return_value = {
        "matches": [{"id": "entry2", "score": 0.92}],
    }
    mock_enrich.return_value = [
        {
            "id": "entry2",
            "imageUrl": "https://example.com/a.jpg",
            "overallAverage": 8.1,
        }
    ]

    out = get_similar_portfolio_photos("entry1", limit=4)

    assert out["sourceId"] == "entry1"
    assert len(out["matches"]) == 1
    assert out["matches"][0]["similarityScore"] == 0.92
    mock_vector.assert_called_once_with("entry1", limit=4)


@patch("api.portfolio_insights._resolve_user_id")
@patch("api.portfolio_insights.resolve_effective_user_id")
@patch("api.portfolio_insights.search_glass_box_feedback")
@patch("api.portfolio_insights._enrich_match_ids")
def test_search_portfolio_enriches_matches(
    mock_enrich,
    mock_search,
    mock_resolve_eff,
    mock_resolve_uid,
) -> None:
    mock_resolve_eff.return_value = None
    mock_resolve_uid.return_value = "6577a1f2b3c4d5e6f7a8b9c0"
    mock_search.return_value = {
        "query": "backlit",
        "mode": "atlas_search",
        "matches": [{"id": "e1", "observations": ["Strong backlight"]}],
    }
    mock_enrich.return_value = [{"id": "e1", "imageUrl": "https://example.com/b.jpg"}]

    out = search_portfolio_library("backlit", limit=5)

    assert out["query"] == "backlit"
    assert out["matches"][0]["matchedObservations"] == ["Strong backlight"]
