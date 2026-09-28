"""Structured output schema the LLM must return."""

from typing import Literal

from pydantic import BaseModel


class TradeRequest(BaseModel):
    """A market order the assistant wants to execute."""

    ticker: str
    side: Literal["buy", "sell"]
    quantity: float


class WatchlistChange(BaseModel):
    """A watchlist add or remove the assistant wants to apply."""

    ticker: str
    action: Literal["add", "remove"]


class ChatResponse(BaseModel):
    """The assistant's full reply: text plus actions to auto-execute."""

    message: str
    trades: list[TradeRequest]
    watchlist_changes: list[WatchlistChange]
