"""Watchlist endpoints."""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app import db
from app.portfolio import add_to_watchlist, remove_from_watchlist

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


class WatchlistAdd(BaseModel):
    ticker: str


@router.get("")
def read_watchlist(request: Request) -> list[dict]:
    """Watched tickers with their latest prices (null until first price)."""
    price_cache = request.app.state.price_cache
    return [_ticker_row(t, price_cache.get(t)) for t in db.get_watchlist()]


@router.post("")
async def add(body: WatchlistAdd, request: Request) -> dict:
    """Add a ticker; 400 if already watched."""
    ticker = body.ticker.strip().upper()
    if not ticker:
        raise HTTPException(status_code=400, detail="Ticker is required")
    if not await add_to_watchlist(ticker, request.app.state.market_source):
        raise HTTPException(status_code=400, detail=f"{ticker} is already in the watchlist")
    return {"ticker": ticker}


@router.delete("/{ticker}")
async def remove(ticker: str, request: Request) -> dict:
    """Remove a ticker; 404 if not watched."""
    ticker = ticker.upper()
    if not await remove_from_watchlist(ticker, request.app.state.market_source):
        raise HTTPException(status_code=404, detail=f"{ticker} is not in the watchlist")
    return {"ticker": ticker}


def _ticker_row(ticker: str, update) -> dict:
    """One watchlist row from an optional PriceUpdate."""
    if update is None:
        return {"ticker": ticker, "price": None, "previous_price": None,
                "change_percent": None, "direction": None}
    return {
        "ticker": ticker,
        "price": update.price,
        "previous_price": update.previous_price,
        "change_percent": update.change_percent,
        "direction": update.direction,
    }
