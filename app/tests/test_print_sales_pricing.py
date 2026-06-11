"""Print sales listing price tiers."""

from sub_agents.tools.print_sales_tools import suggested_list_price_for_score


def test_suggested_price_scales_with_score() -> None:
    low = suggested_list_price_for_score(6.5)
    high = suggested_list_price_for_score(8.6)
    assert high > low
    assert low == 54.25
    assert high == 67.90
