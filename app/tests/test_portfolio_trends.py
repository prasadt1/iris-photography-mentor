"""Portfolio trends aggregation."""

from memory.trends import _delta_recent_vs_older, compute_portfolio_trends


def test_delta_recent_vs_older_improving():
    values = [5.0, 5.5, 6.0, 7.0, 7.5, 8.0]
    assert _delta_recent_vs_older(values) == 2.0


def test_delta_returns_none_when_too_few_points():
    assert _delta_recent_vs_older([7.0, 7.5]) is None


def test_compute_portfolio_trends_empty(monkeypatch):
    class FakeColl:
        def find(self, *args, **kwargs):
            return self

        def sort(self, *args, **kwargs):
            return self

        def limit(self, n):
            return []

    class FakeDb:
        portfolio_entries = FakeColl()

    monkeypatch.setattr("memory.trends.get_db", lambda: FakeDb())
    monkeypatch.setenv("DEMO_USER_ID", "507f1f77bcf86cd799439011")

    out = compute_portfolio_trends(limit=12)
    assert out["photoCount"] == 0
    assert out["insufficientData"] is True
