"""Portfolio valuation against live cached prices."""

from app import db
from app.market import PriceCache


def get_portfolio(price_cache: PriceCache) -> dict:
    """Cash, positions with unrealized P&L, and totals."""
    positions = [_value_position(p, price_cache) for p in db.get_positions()]
    cash = db.get_cash()
    positions_value = sum(p["market_value"] for p in positions)
    return {
        "cash": round(cash, 2),
        "total_value": round(cash + positions_value, 2),
        "positions_value": round(positions_value, 2),
        "unrealized_pnl": round(sum(p["unrealized_pnl"] for p in positions), 2),
        "positions": positions,
    }


def record_snapshot(price_cache: PriceCache) -> None:
    """Persist the current total portfolio value."""
    db.insert_snapshot(get_portfolio(price_cache)["total_value"])


def _value_position(position: dict, price_cache: PriceCache) -> dict:
    """Value one position; falls back to avg cost when no live price exists."""
    quantity, avg_cost = position["quantity"], position["avg_cost"]
    price = price_cache.get_price(position["ticker"]) or avg_cost
    cost_basis = quantity * avg_cost
    pnl = quantity * price - cost_basis
    return {
        "ticker": position["ticker"],
        "quantity": quantity,
        "avg_cost": round(avg_cost, 2),
        "current_price": round(price, 2),
        "market_value": round(quantity * price, 2),
        "unrealized_pnl": round(pnl, 2),
        "pnl_percent": round(pnl / cost_basis * 100, 2) if cost_basis else 0.0,
    }
