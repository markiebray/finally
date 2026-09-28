"""Trade execution: validates and applies market orders atomically."""

from app import db
from app.market import PriceCache

from .valuation import record_snapshot


class TradeError(Exception):
    """A trade was rejected; the message is shown to the user."""


def execute_trade(ticker: str, side: str, quantity: float, price_cache: PriceCache) -> dict:
    """Fill a market order at the current cached price and record a snapshot.

    Returns the trade dict: ticker, side, quantity, price, executed_at.
    """
    ticker = ticker.upper()
    if side not in ("buy", "sell"):
        raise TradeError(f"Invalid side: {side}")
    if quantity <= 0:
        raise TradeError("Quantity must be positive")
    price = price_cache.get_price(ticker)
    if price is None:
        raise TradeError(f"No price available for {ticker}")

    with db.transaction():
        if side == "buy":
            _buy(ticker, quantity, price)
        else:
            _sell(ticker, quantity, price)
        trade = db.insert_trade(ticker, side, quantity, price)

    record_snapshot(price_cache)
    return trade


def _buy(ticker: str, quantity: float, price: float) -> None:
    """Deduct cash and grow the position at a weighted average cost."""
    cash = db.get_cash()
    cost = quantity * price
    if cost > cash:
        raise TradeError("Insufficient cash")
    position = db.get_position(ticker)
    held = position["quantity"] if position else 0.0
    old_cost = held * position["avg_cost"] if position else 0.0
    new_quantity = held + quantity
    db.set_cash(cash - cost)
    db.upsert_position(ticker, new_quantity, (old_cost + cost) / new_quantity)


def _sell(ticker: str, quantity: float, price: float) -> None:
    """Credit cash and shrink the position, deleting it at zero."""
    position = db.get_position(ticker)
    held = position["quantity"] if position else 0.0
    if quantity > held + 1e-9:
        raise TradeError("Insufficient shares")
    db.set_cash(db.get_cash() + quantity * price)
    remaining = held - quantity
    if remaining <= 1e-9:
        db.delete_position(ticker)
    else:
        db.upsert_position(ticker, remaining, position["avg_cost"])
