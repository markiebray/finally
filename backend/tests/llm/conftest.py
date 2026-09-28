"""Fixtures for LLM tests: isolated DB, seeded price cache, fake market source."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.market import PriceCache


@pytest.fixture(autouse=True)
def temp_db(tmp_path, monkeypatch):
    """Point the app at a fresh SQLite file per test."""
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))


@pytest.fixture
def price_cache():
    cache = PriceCache()
    cache.update("AAPL", 100.0)
    cache.update("PYPL", 50.0)
    return cache


@pytest.fixture
def market_source():
    source = MagicMock()
    source.add_ticker = AsyncMock()
    source.remove_ticker = AsyncMock()
    return source
