"""Watchlist changes kept in sync between the DB and the market data source."""

from app import db
from app.market import MarketDataSource


async def add_to_watchlist(ticker: str, market_source: MarketDataSource) -> bool:
    """Add a ticker to the watchlist and start pricing it. False if already present."""
    ticker = ticker.upper()
    if not db.add_watchlist_ticker(ticker):
        return False
    await market_source.add_ticker(ticker)
    return True


async def remove_from_watchlist(ticker: str, market_source: MarketDataSource) -> bool:
    """Remove a ticker from the watchlist. False if it was not present.

    Pricing continues while a position is held so the portfolio stays valued.
    """
    ticker = ticker.upper()
    if not db.remove_watchlist_ticker(ticker):
        return False
    if db.get_position(ticker) is None:
        await market_source.remove_ticker(ticker)
    return True
