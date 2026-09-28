"""SQLite persistence layer: schema, lazy init, transactions, and repository functions."""

from .connection import get_connection, init_db, transaction
from .repository import (
    add_watchlist_ticker,
    delete_position,
    get_cash,
    get_chat_messages,
    get_position,
    get_positions,
    get_snapshots,
    get_trades,
    get_watchlist,
    insert_chat_message,
    insert_snapshot,
    insert_trade,
    remove_watchlist_ticker,
    set_cash,
    upsert_position,
)

__all__ = [
    "add_watchlist_ticker",
    "delete_position",
    "get_cash",
    "get_chat_messages",
    "get_connection",
    "get_position",
    "get_positions",
    "get_snapshots",
    "get_trades",
    "get_watchlist",
    "init_db",
    "insert_chat_message",
    "insert_snapshot",
    "insert_trade",
    "remove_watchlist_ticker",
    "set_cash",
    "transaction",
    "upsert_position",
]
