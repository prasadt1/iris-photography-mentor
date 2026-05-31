"""Organize scan dedupes proposals per shoot_id."""

from unittest.mock import MagicMock, patch

from api.triage_scan import run_triage_scan


@patch("api.triage_scan.list_pending")
@patch("api.triage_scan.triage_tools")
@patch("api.triage_scan._supersede_pending_triage")
@patch("api.triage_scan._resolve_user_id")
def test_triage_scan_one_proposal_per_shoot(
    mock_resolve,
    mock_supersede,
    mock_tools,
    mock_list_pending,
) -> None:
    mock_resolve.return_value = MagicMock()
    mock_supersede.return_value = 0
    mock_list_pending.return_value = []

    mock_tools.cluster_portfolio_by_embedding.return_value = {
        "clusters": [{"label": "landscape", "entryIds": ["aaa"], "count": 3}],
    }
    mock_tools.find_duplicate_portfolio_entries.return_value = {
        "candidates": [{"shootId": "shoot1", "entryIds": ["aaa", "bbb"]}],
    }
    mock_tools.surface_top_scoring_untouched_photos.return_value = {
        "photos": [{"id": "aaa", "averageScore": 9.0}],
    }

    with patch("api.triage_scan._dedupe_key_for_entry", return_value="shoot:shoot1"):
        with patch("api.triage_scan._dedupe_key_for_shoot", return_value="shoot:shoot1"):
            mock_tools.propose_bulk_tag_application.return_value = {"pendingApprovalId": "1"}
            mock_tools.propose_photo_deletion.return_value = {"pendingApprovalId": "2"}

            run_triage_scan(user_id="6577a1f2b3c4d5e6f7a8b9c0")

    mock_tools.propose_photo_deletion.assert_called_once()
    mock_tools.propose_bulk_tag_application.assert_not_called()
