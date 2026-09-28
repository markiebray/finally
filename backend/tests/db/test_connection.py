"""Tests for schema creation, seeding, and transactions."""

import pytest

from app import db
from app.db.connection import DEFAULT_TICKERS


def test_init_creates_file_and_parent_dir(temp_db):
    db.init_db()
    assert temp_db.exists()


def test_init_creates_all_tables():
    db.init_db()
    with db.get_connection() as conn:
        names = {r["name"] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    assert {
        "users_profile",
        "watchlist",
        "positions",
        "trades",
        "portfolio_snapshots",
        "chat_messages",
    } <= names


def test_seed_data():
    assert db.get_cash() == 10000.0
    assert db.get_watchlist() == DEFAULT_TICKERS


def test_init_is_idempotent():
    db.init_db()
    db.remove_watchlist_ticker("AAPL")
    db.set_cash(123.0)
    db.init_db()
    assert db.get_cash() == 123.0
    assert "AAPL" not in db.get_watchlist()
    assert len(db.get_watchlist()) == 9


def test_get_connection_uses_row_factory():
    with db.get_connection() as conn:
        row = conn.execute("SELECT cash_balance FROM users_profile").fetchone()
    assert row["cash_balance"] == 10000.0


def test_transaction_commits():
    with db.transaction():
        db.set_cash(5000.0)
        db.upsert_position("AAPL", 10, 190.0)
        db.insert_trade("AAPL", "buy", 10, 190.0)
    assert db.get_cash() == 5000.0
    assert db.get_position("AAPL")["quantity"] == 10
    assert len(db.get_trades()) == 1


def test_transaction_rolls_back_on_error():
    with pytest.raises(ValueError):
        with db.transaction():
            db.set_cash(5000.0)
            db.upsert_position("AAPL", 10, 190.0)
            raise ValueError("boom")
    assert db.get_cash() == 10000.0
    assert db.get_position("AAPL") is None


def test_nested_transaction_joins_outer():
    with pytest.raises(ValueError):
        with db.transaction():
            with db.transaction():
                db.set_cash(1.0)
            raise ValueError("boom")
    assert db.get_cash() == 10000.0
