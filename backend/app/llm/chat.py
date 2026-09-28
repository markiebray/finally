"""Chat orchestration: ask the LLM, auto-execute its actions, persist the exchange."""

import os

from app import db
from app.market import MarketDataSource, PriceCache
from app.portfolio import TradeError, add_to_watchlist, execute_trade, remove_from_watchlist

from .client import call_llm
from .mock import mock_response
from .models import ChatResponse, TradeRequest, WatchlistChange
from .prompt import build_context, build_messages


async def handle_chat(message: str, price_cache: PriceCache, market_source: MarketDataSource) -> dict:
    """Answer a user message and return the /api/chat response shape."""
    reply = await get_reply(message, price_cache)
    errors: list[str] = []
    trades = [_run_trade(t, price_cache, errors) for t in reply.trades]
    changes = [await _run_change(c, market_source, errors) for c in reply.watchlist_changes]
    actions = {"trades": trades, "watchlist_changes": changes, "errors": errors}
    db.insert_chat_message("user", message)
    db.insert_chat_message("assistant", reply.message, actions)
    return {"message": reply.message, **actions}


async def get_reply(message: str, price_cache: PriceCache) -> ChatResponse:
    """Get the structured reply from the mock or the real LLM."""
    if os.environ.get("LLM_MOCK", "").lower() == "true":
        return mock_response(message)
    messages = build_messages(message, db.get_chat_messages(limit=20), build_context(price_cache))
    return await call_llm(messages)


def _run_trade(trade: TradeRequest, price_cache: PriceCache, errors: list[str]) -> dict:
    """Execute one trade, recording failures in `errors`."""
    result = {"ticker": trade.ticker.upper(), "side": trade.side, "quantity": trade.quantity}
    try:
        executed = execute_trade(trade.ticker, trade.side, trade.quantity, price_cache)
    except TradeError as e:
        errors.append(f"{trade.side.capitalize()} {result['ticker']} {trade.quantity:g}: {e}")
        return {**result, "price": None, "status": "failed", "error": str(e)}
    return {**result, "price": executed["price"], "status": "executed"}


async def _run_change(
    change: WatchlistChange, market_source: MarketDataSource, errors: list[str]
) -> dict:
    """Apply one watchlist change, recording failures in `errors`."""
    ticker = change.ticker.upper()
    if change.action == "add":
        ok = await add_to_watchlist(ticker, market_source)
        error = f"{ticker} is already on the watchlist"
    else:
        ok = await remove_from_watchlist(ticker, market_source)
        error = f"{ticker} is not on the watchlist"
    if not ok:
        errors.append(f"{change.action.capitalize()} {ticker}: {error}")
        return {"ticker": ticker, "action": change.action, "status": "failed", "error": error}
    return {"ticker": ticker, "action": change.action, "status": "executed"}
