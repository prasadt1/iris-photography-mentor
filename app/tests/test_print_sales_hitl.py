"""Print sales dedupe helpers."""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from bson import ObjectId

from memory.pending_approvals import _execute_approved
from memory.print_sales_helpers import dedupe_listed_sales, listing_exists_for_portfolio_entry


def test_list_on_marketplace_approve_inserts_print_sale() -> None:
    mock_db = MagicMock()
    mock_print = MagicMock()
    mock_portfolio = MagicMock()
    mock_db.print_sales = mock_print
    mock_db.portfolio_entries = mock_portfolio
    mock_print.find_one.return_value = None
    mock_portfolio.find_one.return_value = None

    doc = {
        "_id": "approval123",
        "user_id": "user1",
        "proposed_action": {
            "type": "list_on_marketplace",
            "target_id": "674a1b2c3d4e5f6789012345",
            "payload": {
                "marketplace": "etsy",
                "title": "Sunset print",
                "description": "Archival",
                "suggestedListPrice": 52.5,
                "currency": "USD",
                "tags": ["landscape"],
            },
        },
    }

    with patch("memory.pending_approvals.get_db", return_value=mock_db):
        with patch(
            "memory.print_sales_helpers.listing_exists_for_portfolio_entry",
            return_value=False,
        ):
            _execute_approved(doc, {"suggestedListPrice": 60.0})

    mock_print.insert_one.assert_called_once()
    inserted = mock_print.insert_one.call_args[0][0]
    assert inserted["portfolio_entry_id"] == "674a1b2c3d4e5f6789012345"
    assert inserted["marketplace"] == "etsy"
    assert inserted["list_price"] == 60.0
    assert inserted["status"] == "listed"
    mock_portfolio.update_one.assert_called_once()
    update_payload = mock_portfolio.update_one.call_args[0][1]
    assert update_payload["$addToSet"]["user_tags"] == "listed_for_sale"


def test_list_on_marketplace_skips_duplicate_listing() -> None:
    mock_db = MagicMock()
    mock_print = MagicMock()
    mock_db.print_sales = mock_print
    mock_db.portfolio_entries = MagicMock()

    doc = {
        "_id": "approval456",
        "user_id": ObjectId("507f1f77bcf86cd799439011"),
        "proposed_action": {
            "type": "list_on_marketplace",
            "target_id": "674a1b2c3d4e5f6789012345",
            "payload": {"marketplace": "etsy", "title": "Dup"},
        },
    }

    with patch("memory.pending_approvals.get_db", return_value=mock_db):
        with patch(
            "memory.print_sales_helpers.listing_exists_for_portfolio_entry",
            return_value=True,
        ):
            _execute_approved(doc, None)

    mock_print.insert_one.assert_not_called()


def test_dedupe_listed_sales_keeps_newest_per_shoot() -> None:
    uid = ObjectId("507f1f77bcf86cd799439011")
    shoot = ObjectId("507f1f77bcf86cd799439012")
    entry_a = ObjectId("507f1f77bcf86cd799439013")
    entry_b = ObjectId("507f1f77bcf86cd799439014")
    older = {
        "_id": ObjectId("507f1f77bcf86cd799439015"),
        "portfolio_entry_id": str(entry_a),
        "listed_at": datetime(2026, 5, 1, tzinfo=timezone.utc),
    }
    newer = {
        "_id": ObjectId("507f1f77bcf86cd799439016"),
        "portfolio_entry_id": str(entry_b),
        "listed_at": datetime(2026, 5, 2, tzinfo=timezone.utc),
    }

    mock_portfolio = MagicMock()
    mock_portfolio.find_one.side_effect = lambda q, **_: {
        "_id": q["_id"],
        "shoot_id": shoot,
    }

    with patch("memory.print_sales_helpers.get_db") as mock_get_db:
        mock_get_db.return_value.portfolio_entries = mock_portfolio
        result = dedupe_listed_sales([older, newer], uid)

    assert len(result) == 1
    assert result[0]["portfolio_entry_id"] == str(entry_b)


def test_listing_exists_for_portfolio_entry_checks_siblings() -> None:
    uid = ObjectId("507f1f77bcf86cd799439011")
    shoot = ObjectId("507f1f77bcf86cd799439012")
    entry_id = "674a1b2c3d4e5f6789012345"
    sibling_id = ObjectId("674a1b2c3d4e5f6789012346")

    mock_print = MagicMock()
    mock_print.find_one.side_effect = [
        None,
        {"_id": ObjectId(), "portfolio_entry_id": str(sibling_id)},
    ]
    mock_portfolio = MagicMock()
    mock_portfolio.find_one.return_value = {"_id": ObjectId(entry_id), "shoot_id": shoot}
    mock_portfolio.find.return_value = [{"_id": sibling_id}]

    with patch("memory.print_sales_helpers.get_db") as mock_get_db:
        mock_get_db.return_value.print_sales = mock_print
        mock_get_db.return_value.portfolio_entries = mock_portfolio
        assert listing_exists_for_portfolio_entry(uid, entry_id) is True
