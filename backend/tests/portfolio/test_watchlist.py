"""Tests for watchlist changes synced with the market data source."""

from unittest.mock import AsyncMock

import pytest

from app import db
from app.portfolio import add_to_watchlist, execute_trade, remove_from_watchlist


@pytest.fixture
def source():
    return AsyncMock()


async def test_add_new_ticker(source):
    assert await add_to_watchlist("pypl", source) is True
    assert "PYPL" in db.get_watchlist()
    source.add_ticker.assert_awaited_once_with("PYPL")


async def test_add_duplicate_returns_false(source):
    assert await add_to_watchlist("AAPL", source) is False
    source.add_ticker.assert_not_awaited()


async def test_remove_ticker(source):
    assert await remove_from_watchlist("aapl", source) is True
    assert "AAPL" not in db.get_watchlist()
    source.remove_ticker.assert_awaited_once_with("AAPL")


async def test_remove_missing_returns_false(source):
    assert await remove_from_watchlist("ZZZ", source) is False


async def test_remove_held_ticker_keeps_pricing(source, cache):
    execute_trade("AAPL", "buy", 1, cache)
    assert await remove_from_watchlist("AAPL", source) is True
    source.remove_ticker.assert_not_awaited()
