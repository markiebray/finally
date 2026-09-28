"""Deterministic mock LLM used when LLM_MOCK=true (E2E tests, no API key).

Rules (keywords are case-insensitive, tickers must be UPPER-CASE, 1-5 letters):
- "buy 5 AAPL" / "sell 2.5 TSLA" / "buy 5 shares of AAPL" -> that trade.
- "add PYPL" / "remove NFLX" -> that watchlist change.
- Several commands in one message all apply, e.g. "buy 1 AAPL and add PYPL".
- Anything else -> MOCK_REPLY with no actions.
"""

import re

from .models import ChatResponse, TradeRequest, WatchlistChange

MOCK_REPLY = "Hello from FinAlly (mock mode). How can I help with your portfolio?"

TRADE_RE = re.compile(
    r"\b(?i:(buy|sell))\s+(\d+(?:\.\d+)?)\s+(?i:shares?\s+(?:of\s+)?)?([A-Z]{1,5})\b"
)
WATCHLIST_RE = re.compile(r"\b(?i:(add|remove))\s+([A-Z]{1,5})\b")


def mock_response(message: str) -> ChatResponse:
    """Parse simple trade and watchlist commands out of the message."""
    trades = [
        TradeRequest(ticker=ticker, side=side.lower(), quantity=float(qty))
        for side, qty, ticker in TRADE_RE.findall(message)
    ]
    changes = [
        WatchlistChange(ticker=ticker, action=action.lower())
        for action, ticker in WATCHLIST_RE.findall(message)
    ]
    if not trades and not changes:
        return ChatResponse(message=MOCK_REPLY, trades=[], watchlist_changes=[])
    return ChatResponse(message=_describe(trades, changes), trades=trades, watchlist_changes=changes)


def _describe(trades: list[TradeRequest], changes: list[WatchlistChange]) -> str:
    """Summarize the requested actions as the mock reply text."""
    parts = [f"{t.side} {t.quantity:g} {t.ticker}" for t in trades]
    parts += [f"{c.action} {c.ticker} {'to' if c.action == 'add' else 'from'} watchlist" for c in changes]
    return "Done (mock): " + "; ".join(parts) + "."
