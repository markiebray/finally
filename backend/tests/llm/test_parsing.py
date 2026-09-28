"""Structured output parsing and the LiteLLM call wrapper."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from app.llm.client import APOLOGY, call_llm, parse_response

VALID = '{"message": "Bought.", "trades": [{"ticker": "AAPL", "side": "buy", "quantity": 2}], "watchlist_changes": [{"ticker": "PYPL", "action": "add"}]}'


def _llm_result(content):
    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])


def test_parse_valid():
    reply = parse_response(VALID)
    assert reply.message == "Bought."
    assert reply.trades[0].ticker == "AAPL" and reply.trades[0].quantity == 2
    assert reply.watchlist_changes[0].action == "add"


def test_parse_empty_actions():
    reply = parse_response('{"message": "Hi", "trades": [], "watchlist_changes": []}')
    assert reply.message == "Hi" and reply.trades == [] and reply.watchlist_changes == []


def test_parse_malformed_json_falls_back():
    reply = parse_response("not json {")
    assert reply.message == APOLOGY and reply.trades == []


def test_parse_invalid_side_falls_back():
    bad = VALID.replace('"buy"', '"hold"')
    assert parse_response(bad).message == APOLOGY


def test_parse_none_falls_back():
    assert parse_response(None).message == APOLOGY


async def test_call_llm_uses_structured_output():
    with patch("app.llm.client.acompletion", AsyncMock(return_value=_llm_result(VALID))) as mock:
        reply = await call_llm([{"role": "user", "content": "hi"}])
    assert reply.message == "Bought."
    kwargs = mock.call_args.kwargs
    assert kwargs["model"] == "openrouter/openai/gpt-oss-120b"
    assert kwargs["extra_body"] == {"provider": {"order": ["cerebras"]}}
    assert kwargs["response_format"].__name__ == "ChatResponse"


async def test_call_llm_error_falls_back():
    with patch("app.llm.client.acompletion", AsyncMock(side_effect=RuntimeError("down"))):
        reply = await call_llm([{"role": "user", "content": "hi"}])
    assert reply.message == APOLOGY
