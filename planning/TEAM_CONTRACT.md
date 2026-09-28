# Team Contract — Ownership, Interfaces, API Shapes

Shared agreement for the agent team. PLAN.md is the spec; this file pins down the seams between team members.
If you need to change something here, message the affected teammates and update this file.

## Ownership

| Member | Name | Owns |
|---|---|---|
| Database Engineer | `db-engineer` | `backend/app/db/` (+ `backend/tests/db/`) |
| Backend API Engineer | `backend-engineer` | `backend/app/main.py`, `backend/app/api/`, `backend/app/portfolio/` (+ tests), `backend/pyproject.toml` deps |
| LLM Engineer | `llm-engineer` | `backend/app/llm/` (+ `backend/tests/llm/`) |
| Frontend Engineer | `frontend-engineer` | `frontend/` |
| DevOps Engineer | `devops-engineer` | `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `scripts/`, `.env.example`, `.gitignore`, `db/.gitkeep` |
| Integration Tester | `integration-tester` | `test/` (Playwright + `docker-compose.test.yml`) |

`backend/app/market/` is complete — use it, don't rewrite it. Add Python deps with `uv add` (from `backend/`); tell `backend-engineer` if you did.

## Backend Python Interfaces

### `app.db` (db-engineer)
- DB path: env `DB_PATH`, default `<project root>/db/finally.db` (in Docker: `/app/db/finally.db`).
- `init_db()` — create tables if missing, seed default user + 10 watchlist tickers if empty. Idempotent.
- `get_connection()` — sqlite3 connection, `row_factory = sqlite3.Row`.
- Repository functions (all take `user_id="default"`), plain dicts/floats out:
  - `get_cash(user_id) -> float`, `set_cash(cash, user_id)`
  - `get_watchlist(user_id) -> list[str]`, `add_watchlist_ticker(ticker, user_id) -> bool` (False if dup), `remove_watchlist_ticker(ticker, user_id) -> bool`
  - `get_positions(user_id) -> list[dict]` (`ticker, quantity, avg_cost, updated_at`), `get_position(ticker, user_id) -> dict | None`, `upsert_position(ticker, quantity, avg_cost, user_id)`, `delete_position(ticker, user_id)`
  - `insert_trade(ticker, side, quantity, price, user_id) -> dict`, `get_trades(user_id, limit) -> list[dict]`
  - `insert_snapshot(total_value, user_id)`, `get_snapshots(user_id) -> list[dict]` (`total_value, recorded_at`, ascending)
  - `insert_chat_message(role, content, actions: dict | None, user_id)`, `get_chat_messages(user_id, limit=20) -> list[dict]` (ascending, `actions` decoded)
- Trade execution must be atomic: expose a `transaction()` context manager, or have the backend do cash/position/trade writes on one connection. Agree with `backend-engineer`.

### `app.portfolio` (backend-engineer)
- `class TradeError(Exception)` — message is user-facing ("Insufficient cash", "Insufficient shares", "No price available for XYZ").
- `execute_trade(ticker, side, quantity, price_cache) -> dict` — validates, updates cash/position, logs trade, records snapshot. Returns trade dict: `{ticker, side, quantity, price, executed_at}`.
- `get_portfolio(price_cache) -> dict` — shape below.
- `add_to_watchlist(ticker, market_source)`, `remove_from_watchlist(ticker, market_source)` — DB + market data source kept in sync.

### `app.llm` (llm-engineer)
- `async def handle_chat(message: str, price_cache, market_source) -> dict` — returns the `/api/chat` response below. Uses `app.portfolio` functions to execute actions, `app.db` for history. Honors `LLM_MOCK=true`.

## REST / SSE Shapes

All tickers upper-cased server-side. Errors: HTTP 400 `{"detail": "message"}`.

- `GET /api/health` → `{"status": "ok"}`
- `GET /api/stream/prices` → SSE (already built in `app/market/stream.py`; each event's `data` is a JSON object keyed by ticker, one entry per ticker: `{"AAPL": {"ticker", "price", "previous_price", "timestamp", "change", "change_percent", "direction"}, "GOOGL": {...}}`)
- `GET /api/portfolio` →
  ```json
  {"cash": 8100.0, "total_value": 10050.2, "positions_value": 1950.2, "unrealized_pnl": 50.2,
   "positions": [{"ticker": "AAPL", "quantity": 10, "avg_cost": 190.0, "current_price": 195.02,
                  "market_value": 1950.2, "unrealized_pnl": 50.2, "pnl_percent": 2.64}]}
  ```
- `POST /api/portfolio/trade` body `{"ticker": "AAPL", "quantity": 10, "side": "buy"}` → `{"trade": {...}, "portfolio": {...}}`
- `GET /api/portfolio/history` → `[{"total_value": 10000.0, "recorded_at": "2026-...Z"}]`
- `GET /api/watchlist` → `[{"ticker": "AAPL", "price": 190.1, "previous_price": 190.0, "change_percent": 0.05, "direction": "up"}]` (price fields null if no price yet)
- `POST /api/watchlist` body `{"ticker": "PYPL"}` → `{"ticker": "PYPL"}` (400 on duplicate)
- `DELETE /api/watchlist/{ticker}` → `{"ticker": "PYPL"}` (404 if missing)
- `GET /api/chat` → chat history, oldest first (last 50): `[{"role": "user"|"assistant", "content": "...", "actions": {trades, watchlist_changes, errors} | null, "created_at": "...Z"}]`
- `POST /api/chat` body `{"message": "..."}` →
  ```json
  {"message": "Bought 5 AAPL.",
   "trades": [{"ticker": "AAPL", "side": "buy", "quantity": 5, "price": 190.1, "status": "executed"}],
   "watchlist_changes": [{"ticker": "PYPL", "action": "add", "status": "executed"}],
   "errors": ["Sell TSLA 100: Insufficient shares"]}
  ```

## Static Frontend

Next.js static export (`output: 'export'`) → `frontend/out/`. In Docker it is copied to `backend/static/` (`/app/static`). FastAPI mounts `StaticFiles(directory=static, html=True)` at `/` **after** all `/api` routes, only if the directory exists. Env `STATIC_DIR` overrides the path.

## Stable Test Selectors (frontend-engineer ↔ integration-tester)

Use `data-testid`: `connection-status`, `cash-balance`, `total-value`, `watchlist`, `watchlist-row-{TICKER}`, `price-{TICKER}`, `watchlist-add-input`, `watchlist-add-button`, `watchlist-remove-{TICKER}`, `main-chart`, `trade-ticker`, `trade-quantity`, `trade-buy`, `trade-sell`, `trade-error`, `positions-table`, `position-row-{TICKER}`, `heatmap`, `pnl-chart`, `chat-input`, `chat-send`, `chat-message`, `chat-loading`. Add more as needed and note them here.

Added by frontend-engineer: `unrealized-pnl` (header), `watchlist-error` (add-ticker failure), `sparkline` (one per watchlist row), `heatmap-tile-{TICKER}`, `chat-panel`, `chat-toggle` (collapse/expand), `chat-actions` (inline trade/watchlist confirmation chips inside an assistant message).
Data attributes: `connection-status[data-status=connected|reconnecting|disconnected]`, `main-chart[data-ticker]` (selected ticker), `pnl-chart[data-points]` (snapshot count), `chat-message[data-role=user|assistant]`. On load the chat panel renders `GET /api/chat` history (each saved message is a `chat-message`, and assistant ones include `chat-actions` chips). If the history is empty it shows one assistant welcome `chat-message` instead. The default selected ticker is the first watchlist entry, and clicking a watchlist row also fills `trade-ticker`.

## Local Dev

- Backend: `cd backend && uv run uvicorn app.main:app --port 8000`
- Frontend: `cd frontend && npm run dev` with Next rewrites proxying `/api/*` → `http://localhost:8000` in dev only.
