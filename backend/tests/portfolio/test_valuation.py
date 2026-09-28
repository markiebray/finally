"""Tests for portfolio valuation."""

from app.portfolio import execute_trade, get_portfolio


def test_empty_portfolio(cache):
    assert get_portfolio(cache) == {
        "cash": 10000.0,
        "total_value": 10000.0,
        "positions_value": 0.0,
        "unrealized_pnl": 0.0,
        "positions": [],
    }


def test_portfolio_values_positions_at_live_price(cache):
    execute_trade("AAPL", "buy", 10, cache)
    cache.update("AAPL", 110.0)
    portfolio = get_portfolio(cache)
    assert portfolio["cash"] == 9000.0
    assert portfolio["positions_value"] == 1100.0
    assert portfolio["total_value"] == 10100.0
    assert portfolio["unrealized_pnl"] == 100.0
    assert portfolio["positions"] == [{
        "ticker": "AAPL",
        "quantity": 10,
        "avg_cost": 100.0,
        "current_price": 110.0,
        "market_value": 1100.0,
        "unrealized_pnl": 100.0,
        "pnl_percent": 10.0,
    }]


def test_position_without_price_falls_back_to_avg_cost(cache):
    execute_trade("AAPL", "buy", 10, cache)
    cache.remove("AAPL")
    position = get_portfolio(cache)["positions"][0]
    assert position["current_price"] == 100.0
    assert position["unrealized_pnl"] == 0.0
