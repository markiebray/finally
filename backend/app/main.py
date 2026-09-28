"""FastAPI application: REST API, SSE price stream, and static frontend."""

import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR.parent / ".env")

from app import db  # noqa: E402
from app.api import chat_router, health_router, portfolio_router, watchlist_router  # noqa: E402
from app.market import PriceCache, create_market_data_source, create_stream_router  # noqa: E402
from app.portfolio import record_snapshot  # noqa: E402

SNAPSHOT_INTERVAL_SECONDS = 30

price_cache = PriceCache()


async def snapshot_loop(cache: PriceCache) -> None:
    """Record the portfolio value on a fixed interval."""
    while True:
        await asyncio.sleep(SNAPSHOT_INTERVAL_SECONDS)
        record_snapshot(cache)


def tracked_tickers() -> list[str]:
    """Watchlist tickers plus any held tickers, so every position has a price."""
    held = [p["ticker"] for p in db.get_positions()]
    return list(dict.fromkeys(db.get_watchlist() + held))


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the DB, start market data and the snapshot task; stop them on shutdown."""
    db.init_db()
    source = create_market_data_source(price_cache)
    await source.start(tracked_tickers())
    app.state.price_cache = price_cache
    app.state.market_source = source
    snapshots = asyncio.create_task(snapshot_loop(price_cache))
    yield
    snapshots.cancel()
    await source.stop()


app = FastAPI(title="FinAlly", lifespan=lifespan)
app.include_router(health_router)
app.include_router(portfolio_router)
app.include_router(watchlist_router)
app.include_router(chat_router)
app.include_router(create_stream_router(price_cache))

static_dir = Path(os.environ.get("STATIC_DIR", BACKEND_DIR / "static"))
if static_dir.is_dir():
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
