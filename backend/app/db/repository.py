"""Repository functions: plain dicts and floats in and out.

Each call runs on the active `transaction()` connection if there is one, else commits on its own.
"""

import json

from .connection import DEFAULT_USER, new_id, now_iso, transaction


def get_cash(user_id: str = DEFAULT_USER) -> float:
    """Return the user's cash balance."""
    with transaction() as conn:
        row = conn.execute(
            "SELECT cash_balance FROM users_profile WHERE id = ?", (user_id,)
        ).fetchone()
    return row["cash_balance"]


def set_cash(cash: float, user_id: str = DEFAULT_USER) -> None:
    """Set the user's cash balance."""
    with transaction() as conn:
        conn.execute("UPDATE users_profile SET cash_balance = ? WHERE id = ?", (cash, user_id))


def get_watchlist(user_id: str = DEFAULT_USER) -> list[str]:
    """Return watched tickers in the order they were added."""
    with transaction() as conn:
        rows = conn.execute(
            "SELECT ticker FROM watchlist WHERE user_id = ? ORDER BY added_at, rowid", (user_id,)
        ).fetchall()
    return [r["ticker"] for r in rows]


def add_watchlist_ticker(ticker: str, user_id: str = DEFAULT_USER) -> bool:
    """Add a ticker to the watchlist. Returns False if it was already there."""
    with transaction() as conn:
        cur = conn.execute(
            "INSERT OR IGNORE INTO watchlist (id, user_id, ticker, added_at) VALUES (?, ?, ?, ?)",
            (new_id(), user_id, ticker, now_iso()),
        )
    return cur.rowcount == 1


def remove_watchlist_ticker(ticker: str, user_id: str = DEFAULT_USER) -> bool:
    """Remove a ticker from the watchlist. Returns False if it was not there."""
    with transaction() as conn:
        cur = conn.execute(
            "DELETE FROM watchlist WHERE user_id = ? AND ticker = ?", (user_id, ticker)
        )
    return cur.rowcount == 1


def get_positions(user_id: str = DEFAULT_USER) -> list[dict]:
    """Return all positions as dicts with `ticker, quantity, avg_cost, updated_at`."""
    with transaction() as conn:
        rows = conn.execute(
            "SELECT ticker, quantity, avg_cost, updated_at FROM positions"
            " WHERE user_id = ? ORDER BY ticker",
            (user_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def get_position(ticker: str, user_id: str = DEFAULT_USER) -> dict | None:
    """Return one position dict, or None if the user holds none of `ticker`."""
    with transaction() as conn:
        row = conn.execute(
            "SELECT ticker, quantity, avg_cost, updated_at FROM positions"
            " WHERE user_id = ? AND ticker = ?",
            (user_id, ticker),
        ).fetchone()
    return dict(row) if row else None


def upsert_position(
    ticker: str, quantity: float, avg_cost: float, user_id: str = DEFAULT_USER
) -> None:
    """Create or replace the position for `ticker`."""
    with transaction() as conn:
        conn.execute(
            "INSERT INTO positions (id, user_id, ticker, quantity, avg_cost, updated_at)"
            " VALUES (?, ?, ?, ?, ?, ?)"
            " ON CONFLICT (user_id, ticker) DO UPDATE SET"
            " quantity = excluded.quantity, avg_cost = excluded.avg_cost,"
            " updated_at = excluded.updated_at",
            (new_id(), user_id, ticker, quantity, avg_cost, now_iso()),
        )


def delete_position(ticker: str, user_id: str = DEFAULT_USER) -> None:
    """Delete the position for `ticker`."""
    with transaction() as conn:
        conn.execute("DELETE FROM positions WHERE user_id = ? AND ticker = ?", (user_id, ticker))


def insert_trade(
    ticker: str, side: str, quantity: float, price: float, user_id: str = DEFAULT_USER
) -> dict:
    """Append a trade and return `{ticker, side, quantity, price, executed_at}`."""
    trade = {
        "ticker": ticker,
        "side": side,
        "quantity": quantity,
        "price": price,
        "executed_at": now_iso(),
    }
    with transaction() as conn:
        conn.execute(
            "INSERT INTO trades (id, user_id, ticker, side, quantity, price, executed_at)"
            " VALUES (?, ?, ?, ?, ?, ?, ?)",
            (new_id(), user_id, ticker, side, quantity, price, trade["executed_at"]),
        )
    return trade


def get_trades(user_id: str = DEFAULT_USER, limit: int = 50) -> list[dict]:
    """Return the most recent trades, newest first."""
    with transaction() as conn:
        rows = conn.execute(
            "SELECT ticker, side, quantity, price, executed_at FROM trades"
            " WHERE user_id = ? ORDER BY executed_at DESC, rowid DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
    return [dict(r) for r in rows]


def insert_snapshot(total_value: float, user_id: str = DEFAULT_USER) -> None:
    """Record the portfolio's total value now."""
    with transaction() as conn:
        conn.execute(
            "INSERT INTO portfolio_snapshots (id, user_id, total_value, recorded_at)"
            " VALUES (?, ?, ?, ?)",
            (new_id(), user_id, total_value, now_iso()),
        )


def get_snapshots(user_id: str = DEFAULT_USER) -> list[dict]:
    """Return all snapshots as `{total_value, recorded_at}`, oldest first."""
    with transaction() as conn:
        rows = conn.execute(
            "SELECT total_value, recorded_at FROM portfolio_snapshots"
            " WHERE user_id = ? ORDER BY recorded_at, rowid",
            (user_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def insert_chat_message(
    role: str, content: str, actions: dict | None = None, user_id: str = DEFAULT_USER
) -> None:
    """Store a chat message; `actions` is JSON-encoded (None stays NULL)."""
    with transaction() as conn:
        conn.execute(
            "INSERT INTO chat_messages (id, user_id, role, content, actions, created_at)"
            " VALUES (?, ?, ?, ?, ?, ?)",
            (
                new_id(),
                user_id,
                role,
                content,
                json.dumps(actions) if actions is not None else None,
                now_iso(),
            ),
        )


def get_chat_messages(user_id: str = DEFAULT_USER, limit: int = 20) -> list[dict]:
    """Return the last `limit` messages, oldest first, with `actions` decoded."""
    with transaction() as conn:
        rows = conn.execute(
            "SELECT role, content, actions, created_at FROM chat_messages"
            " WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
    messages = [dict(r) for r in reversed(rows)]
    for m in messages:
        m["actions"] = json.loads(m["actions"]) if m["actions"] else None
    return messages
