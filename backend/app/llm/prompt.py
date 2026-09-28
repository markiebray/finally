"""System prompt, portfolio context, and message assembly for the LLM."""

import json

from app import db
from app.market import PriceCache
from app.portfolio import get_portfolio

SYSTEM_PROMPT = """You are FinAlly, an AI trading assistant inside a simulated trading workstation.
The user trades a virtual portfolio with fake money using market orders that fill instantly.

You can:
- Analyze portfolio composition, risk concentration, and P&L.
- Suggest trades with brief reasoning.
- Execute trades when the user asks or agrees, by listing them in "trades".
- Manage the watchlist proactively, by listing changes in "watchlist_changes".

Rules:
- Be concise and data-driven. Use the numbers in the portfolio context.
- Only include trades the user asked for or agreed to. Quantities are shares (fractions allowed).
- Trades and watchlist changes you list are executed immediately by the system, so describe
  them as done (e.g. "Bought 1 AAPL at $189.92."), never as pending or "processing".
- Use upper-case ticker symbols.
- Use empty lists when there are no trades or watchlist changes.
- Always respond with valid JSON matching the required schema."""


def build_context(price_cache: PriceCache) -> str:
    """Describe cash, positions with P&L, watchlist prices, and total value as JSON text."""
    watchlist = []
    for ticker in db.get_watchlist():
        update = price_cache.get(ticker)
        watchlist.append(
            {
                "ticker": ticker,
                "price": update.price if update else None,
                "change_percent": update.change_percent if update else None,
            }
        )
    context = {"portfolio": get_portfolio(price_cache), "watchlist": watchlist}
    return "Current portfolio context:\n" + json.dumps(context, indent=2)


def build_messages(user_message: str, history: list[dict], context: str) -> list[dict]:
    """Assemble system prompt, context, prior conversation, and the new user message."""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": context},
    ]
    messages += [{"role": m["role"], "content": m["content"]} for m in history]
    messages.append({"role": "user", "content": user_message})
    return messages
