"""Deterministic mock LLM rules."""

from app.llm.mock import MOCK_REPLY, mock_response


def test_buy():
    reply = mock_response("buy 5 AAPL")
    assert [(t.ticker, t.side, t.quantity) for t in reply.trades] == [("AAPL", "buy", 5.0)]


def test_sell_fractional_with_shares_of():
    reply = mock_response("Sell 2.5 shares of TSLA")
    assert [(t.ticker, t.side, t.quantity) for t in reply.trades] == [("TSLA", "sell", 2.5)]


def test_watchlist_add_and_remove():
    reply = mock_response("add PYPL and remove NFLX")
    assert [(c.ticker, c.action) for c in reply.watchlist_changes] == [
        ("PYPL", "add"),
        ("NFLX", "remove"),
    ]


def test_combined_commands():
    reply = mock_response("buy 1 AAPL and add PYPL")
    assert len(reply.trades) == 1 and len(reply.watchlist_changes) == 1


def test_lowercase_ticker_ignored():
    reply = mock_response("add some cash")
    assert reply.message == MOCK_REPLY and not reply.watchlist_changes


def test_default_reply():
    reply = mock_response("hello")
    assert reply.message == MOCK_REPLY and reply.trades == [] and reply.watchlist_changes == []
