"""Portfolio endpoints: holdings, trading, and value history."""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app import db
from app.portfolio import TradeError, execute_trade, get_portfolio

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


class TradeRequest(BaseModel):
    ticker: str
    quantity: float
    side: str


@router.get("")
def read_portfolio(request: Request) -> dict:
    """Current cash, positions, and totals."""
    return get_portfolio(request.app.state.price_cache)


@router.post("/trade")
def trade(body: TradeRequest, request: Request) -> dict:
    """Execute a market order and return the trade plus updated portfolio."""
    price_cache = request.app.state.price_cache
    try:
        result = execute_trade(body.ticker, body.side, body.quantity, price_cache)
    except TradeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"trade": result, "portfolio": get_portfolio(price_cache)}


@router.get("/history")
def history() -> list[dict]:
    """Portfolio value snapshots, oldest first."""
    return db.get_snapshots()
