"""Tests for the chat endpoint in mock LLM mode."""

from app import db


def test_chat_returns_contract_shape(client):
    response = client.post("/api/chat", json={"message": "hello"})
    assert response.status_code == 200
    body = response.json()
    assert set(body) >= {"message", "trades", "watchlist_changes", "errors"}
    assert body["message"]


def test_chat_persists_messages(client):
    client.post("/api/chat", json={"message": "hello"})
    roles = [m["role"] for m in db.get_chat_messages()]
    assert roles == ["user", "assistant"]


def test_chat_executes_trade_and_watchlist_change(client):
    body = client.post("/api/chat", json={"message": "buy 2 AAPL and add PYPL"}).json()
    assert body["trades"][0]["status"] == "executed"
    assert body["watchlist_changes"][0]["status"] == "executed"
    portfolio = client.get("/api/portfolio").json()
    assert portfolio["positions"][0]["ticker"] == "AAPL"


def test_chat_reports_failed_trade(client):
    body = client.post("/api/chat", json={"message": "sell 5 TSLA"}).json()
    assert body["trades"][0]["status"] == "failed"
    assert "Insufficient shares" in body["errors"][0]


def test_blank_message_returns_400(client):
    response = client.post("/api/chat", json={"message": "  "})
    assert response.status_code == 400


def test_history_empty_initially(client):
    assert client.get("/api/chat").json() == []


def test_history_returns_messages_oldest_first(client):
    client.post("/api/chat", json={"message": "buy 1 AAPL"})
    history = client.get("/api/chat").json()
    assert [m["role"] for m in history] == ["user", "assistant"]
    user, assistant = history
    assert set(user) == {"role", "content", "actions", "created_at"}
    assert user["content"] == "buy 1 AAPL"
    assert user["actions"] is None
    assert assistant["actions"]["trades"][0]["ticker"] == "AAPL"


def test_history_limited_to_last_50(client):
    for i in range(26):
        client.post("/api/chat", json={"message": f"hi {i}"})
    history = client.get("/api/chat").json()
    assert len(history) == 50
    assert history[0]["content"] == "hi 1"
