"""Tests for trade execution."""

import pytest

from app import db
from app.portfolio import TradeError, execute_trade


def test_buy_deducts_cash_and_creates_position(cache):
    trade = execute_trade("aapl", "buy", 10, cache)
    assert trade["ticker"] == "AAPL"
    assert trade["price"] == 100.0
    assert db.get_cash() == 9000.0
    position = db.get_position("AAPL")
    assert position["quantity"] == 10
    assert position["avg_cost"] == 100.0


def test_buy_twice_uses_weighted_average_cost(cache):
    execute_trade("AAPL", "buy", 10, cache)
    cache.update("AAPL", 130.0)
    execute_trade("AAPL", "buy", 20, cache)
    position = db.get_position("AAPL")
    assert position["quantity"] == 30
    assert position["avg_cost"] == pytest.approx(120.0)


def test_buy_with_insufficient_cash_changes_nothing(cache):
    with pytest.raises(TradeError, match="Insufficient cash"):
        execute_trade("AAPL", "buy", 101, cache)
    assert db.get_cash() == 10000.0
    assert db.get_position("AAPL") is None
    assert db.get_trades() == []


def test_sell_at_loss_credits_cash_and_keeps_avg_cost(cache):
    execute_trade("AAPL", "buy", 10, cache)
    cache.update("AAPL", 80.0)
    execute_trade("AAPL", "sell", 4, cache)
    assert db.get_cash() == 9000.0 + 320.0
    position = db.get_position("AAPL")
    assert position["quantity"] == 6
    assert position["avg_cost"] == 100.0


def test_sell_all_deletes_position(cache):
    execute_trade("AAPL", "buy", 2.5, cache)
    execute_trade("AAPL", "sell", 2.5, cache)
    assert db.get_position("AAPL") is None
    assert db.get_cash() == 10000.0


def test_sell_more_than_owned_fails(cache):
    execute_trade("AAPL", "buy", 5, cache)
    with pytest.raises(TradeError, match="Insufficient shares"):
        execute_trade("AAPL", "sell", 6, cache)
    assert db.get_position("AAPL")["quantity"] == 5


def test_sell_without_position_fails(cache):
    with pytest.raises(TradeError, match="Insufficient shares"):
        execute_trade("TSLA", "sell", 1, cache)


def test_unpriced_ticker_fails(cache):
    with pytest.raises(TradeError, match="No price available for ZZZ"):
        execute_trade("ZZZ", "buy", 1, cache)


@pytest.mark.parametrize("side,quantity", [("hold", 1), ("buy", 0), ("sell", -1)])
def test_invalid_order_fails(cache, side, quantity):
    with pytest.raises(TradeError):
        execute_trade("AAPL", side, quantity, cache)


def test_trade_is_logged_and_snapshot_recorded(cache):
    execute_trade("AAPL", "buy", 10, cache)
    assert len(db.get_trades()) == 1
    snapshots = db.get_snapshots()
    assert len(snapshots) == 1
    assert snapshots[0]["total_value"] == 10000.0
