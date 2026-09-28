"""Tests for repository functions."""

from app import db


def test_set_and_get_cash():
    db.set_cash(4321.5)
    assert db.get_cash() == 4321.5


def test_add_watchlist_ticker():
    assert db.add_watchlist_ticker("PYPL") is True
    assert db.get_watchlist()[-1] == "PYPL"


def test_add_duplicate_watchlist_ticker_returns_false():
    assert db.add_watchlist_ticker("AAPL") is False
    assert db.get_watchlist().count("AAPL") == 1


def test_remove_watchlist_ticker():
    assert db.remove_watchlist_ticker("AAPL") is True
    assert "AAPL" not in db.get_watchlist()
    assert db.remove_watchlist_ticker("AAPL") is False


def test_upsert_inserts_then_updates_position():
    db.upsert_position("AAPL", 10, 190.0)
    db.upsert_position("AAPL", 15, 192.5)
    positions = db.get_positions()
    assert len(positions) == 1
    assert positions[0]["ticker"] == "AAPL"
    assert positions[0]["quantity"] == 15
    assert positions[0]["avg_cost"] == 192.5
    assert positions[0]["updated_at"].endswith("Z")


def test_fractional_quantity():
    db.upsert_position("TSLA", 0.25, 250.0)
    assert db.get_position("TSLA")["quantity"] == 0.25


def test_get_position_missing_returns_none():
    assert db.get_position("NOPE") is None


def test_delete_position():
    db.upsert_position("AAPL", 10, 190.0)
    db.delete_position("AAPL")
    assert db.get_positions() == []


def test_insert_and_get_trades_newest_first():
    first = db.insert_trade("AAPL", "buy", 10, 190.0)
    db.insert_trade("AAPL", "sell", 5, 195.0)
    assert first == {
        "ticker": "AAPL",
        "side": "buy",
        "quantity": 10,
        "price": 190.0,
        "executed_at": first["executed_at"],
    }
    trades = db.get_trades()
    assert [t["side"] for t in trades] == ["sell", "buy"]
    assert len(db.get_trades(limit=1)) == 1


def test_snapshots_ascending():
    db.insert_snapshot(10000.0)
    db.insert_snapshot(10050.0)
    snapshots = db.get_snapshots()
    assert [s["total_value"] for s in snapshots] == [10000.0, 10050.0]
    assert set(snapshots[0]) == {"total_value", "recorded_at"}


def test_chat_messages_round_trip():
    db.insert_chat_message("user", "buy 5 AAPL")
    actions = {"trades": [{"ticker": "AAPL", "side": "buy", "quantity": 5}]}
    db.insert_chat_message("assistant", "Done.", actions)
    messages = db.get_chat_messages()
    assert [m["role"] for m in messages] == ["user", "assistant"]
    assert messages[0]["actions"] is None
    assert messages[1]["actions"] == actions


def test_chat_messages_limit_keeps_most_recent_ascending():
    for i in range(5):
        db.insert_chat_message("user", f"msg {i}")
    messages = db.get_chat_messages(limit=3)
    assert [m["content"] for m in messages] == ["msg 2", "msg 3", "msg 4"]


def test_user_isolation():
    db.insert_snapshot(1.0, user_id="other")
    assert db.get_snapshots() == []
    assert db.get_watchlist(user_id="other") == []
