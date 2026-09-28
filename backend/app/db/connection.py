"""SQLite connection management, lazy initialization, and transactions."""

import os
import sqlite3
import uuid
from collections.abc import Iterator
from contextlib import contextmanager
from contextvars import ContextVar
from datetime import UTC, datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
SCHEMA_PATH = Path(__file__).with_name("schema.sql")
DEFAULT_USER = "default"
DEFAULT_CASH = 10000.0
DEFAULT_TICKERS = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "NVDA", "META", "JPM", "V", "NFLX"]

_initialized: set[str] = set()
_active_conn: ContextVar[sqlite3.Connection | None] = ContextVar("active_conn", default=None)


def db_path() -> Path:
    """Return the database file path from env `DB_PATH`, defaulting to `<root>/db/finally.db`."""
    return Path(os.environ.get("DB_PATH") or PROJECT_ROOT / "db" / "finally.db")


def new_id() -> str:
    """Return a new UUID string for a primary key."""
    return str(uuid.uuid4())


def now_iso() -> str:
    """Return the current UTC time as an ISO 8601 string ending in `Z`."""
    return datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%S.%fZ")


def _connect(path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create tables if missing and seed the default user and watchlist if empty. Idempotent."""
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = _connect(path)
    try:
        with conn:
            conn.executescript(SCHEMA_PATH.read_text())
            now = now_iso()
            conn.execute(
                "INSERT OR IGNORE INTO users_profile (id, cash_balance, created_at) VALUES (?, ?, ?)",
                (DEFAULT_USER, DEFAULT_CASH, now),
            )
            if conn.execute("SELECT COUNT(*) FROM watchlist").fetchone()[0] == 0:
                conn.executemany(
                    "INSERT INTO watchlist (id, user_id, ticker, added_at) VALUES (?, ?, ?, ?)",
                    [(new_id(), DEFAULT_USER, t, now) for t in DEFAULT_TICKERS],
                )
    finally:
        conn.close()
    _initialized.add(str(path))


def get_connection() -> sqlite3.Connection:
    """Return a new connection (row_factory = sqlite3.Row), initializing the DB on first use."""
    path = db_path()
    if str(path) not in _initialized:
        init_db()
    return _connect(path)


@contextmanager
def transaction() -> Iterator[sqlite3.Connection]:
    """Run all repository calls inside the block on one connection, committed atomically.

    Commits on normal exit, rolls back if an exception escapes. Nested use joins the outer one.
    """
    if _active_conn.get() is not None:
        yield _active_conn.get()
        return
    conn = get_connection()
    token = _active_conn.set(conn)
    try:
        with conn:
            yield conn
    finally:
        _active_conn.reset(token)
        conn.close()
