"""Fixtures for portfolio tests: temp DB and a seeded price cache."""

import pytest

from app import db
from app.market import PriceCache


@pytest.fixture(autouse=True)
def temp_db(tmp_path, monkeypatch):
    """Point the DB at a fresh temp file."""
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    db.init_db()


@pytest.fixture
def cache():
    """Price cache with AAPL at 100 and TSLA at 200."""
    cache = PriceCache()
    cache.update("AAPL", 100.0)
    cache.update("TSLA", 200.0)
    return cache
