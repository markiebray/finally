"""handle_chat: action execution, error collection, persistence, prompt assembly."""

from unittest.mock import AsyncMock, patch

import pytest

from app import db
from app.llm import handle_chat
from app.llm.models import ChatResponse
from app.llm.prompt import SYSTEM_PROMPT, build_context


@pytest.fixture
def mock_mode(monkeypatch):
    monkeypatch.setenv("LLM_MOCK", "true")


async def test_buy_executes(mock_mode, price_cache, market_source):
    result = await handle_chat("buy 5 AAPL", price_cache, market_source)
    assert result["trades"] == [
        {"ticker": "AAPL", "side": "buy", "quantity": 5.0, "price": 100.0, "status": "executed"}
    ]
    assert result["errors"] == []
    assert db.get_cash() == pytest.approx(9500.0)
    assert db.get_position("AAPL")["quantity"] == 5.0


async def test_failed_trade_reported(mock_mode, price_cache, market_source):
    result = await handle_chat("sell 10 AAPL", price_cache, market_source)
    assert result["trades"][0]["status"] == "failed"
    assert result["errors"] == ["Sell AAPL 10: Insufficient shares"]
    assert db.get_cash() == pytest.approx(10000.0)


async def test_watchlist_add_then_duplicate(mock_mode, price_cache, market_source):
    first = await handle_chat("add PYPL", price_cache, market_source)
    assert first["watchlist_changes"] == [{"ticker": "PYPL", "action": "add", "status": "executed"}]
    market_source.add_ticker.assert_awaited_once_with("PYPL")
    second = await handle_chat("add PYPL", price_cache, market_source)
    assert second["watchlist_changes"][0]["status"] == "failed"
    assert second["errors"] == ["Add PYPL: PYPL is already on the watchlist"]


async def test_watchlist_remove(mock_mode, price_cache, market_source):
    result = await handle_chat("remove NFLX", price_cache, market_source)
    assert result["watchlist_changes"][0]["status"] == "executed"
    assert "NFLX" not in db.get_watchlist()


async def test_messages_persisted(mock_mode, price_cache, market_source):
    await handle_chat("buy 1 AAPL", price_cache, market_source)
    user, assistant = db.get_chat_messages()
    assert (user["role"], user["content"], user["actions"]) == ("user", "buy 1 AAPL", None)
    assert assistant["role"] == "assistant"
    assert assistant["actions"]["trades"][0]["status"] == "executed"


async def test_real_path_builds_prompt(monkeypatch, price_cache, market_source):
    monkeypatch.delenv("LLM_MOCK", raising=False)
    db.insert_chat_message("user", "earlier question")
    db.insert_chat_message("assistant", "earlier answer", {"trades": []})
    reply = ChatResponse(message="Hi there", trades=[], watchlist_changes=[])
    with patch("app.llm.chat.call_llm", AsyncMock(return_value=reply)) as mock:
        result = await handle_chat("new question", price_cache, market_source)
    messages = mock.call_args.args[0]
    assert messages[0] == {"role": "system", "content": SYSTEM_PROMPT}
    assert "cash" in messages[1]["content"]
    assert [m["content"] for m in messages[2:]] == ["earlier question", "earlier answer", "new question"]
    assert result == {"message": "Hi there", "trades": [], "watchlist_changes": [], "errors": []}


def test_context_includes_portfolio_and_prices(price_cache):
    context = build_context(price_cache)
    assert '"cash": 10000.0' in context
    assert '"ticker": "AAPL"' in context and '"price": 100.0' in context
