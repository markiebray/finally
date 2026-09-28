"""Tests for portfolio endpoints."""

import pytest


def buy(client, ticker="AAPL", quantity=2, side="buy"):
    return client.post(
        "/api/portfolio/trade", json={"ticker": ticker, "quantity": quantity, "side": side}
    )


def test_initial_portfolio(client):
    body = client.get("/api/portfolio").json()
    assert body["cash"] == 10000.0
    assert body["total_value"] == 10000.0
    assert body["positions"] == []


def test_buy_returns_trade_and_portfolio(client):
    response = buy(client, "aapl", 2)
    assert response.status_code == 200
    body = response.json()
    trade = body["trade"]
    assert trade["ticker"] == "AAPL"
    assert set(trade) == {"ticker", "side", "quantity", "price", "executed_at"}
    assert body["portfolio"]["cash"] == pytest.approx(10000 - 2 * trade["price"], abs=0.01)
    assert body["portfolio"]["positions"][0]["ticker"] == "AAPL"


def test_sell_everything_removes_position(client):
    buy(client, "AAPL", 2)
    body = buy(client, "AAPL", 2, side="sell").json()
    assert body["portfolio"]["positions"] == []


@pytest.mark.parametrize(
    "payload,detail",
    [
        ({"ticker": "AAPL", "quantity": 1000, "side": "buy"}, "Insufficient cash"),
        ({"ticker": "AAPL", "quantity": 1, "side": "sell"}, "Insufficient shares"),
        ({"ticker": "ZZZZ", "quantity": 1, "side": "buy"}, "No price available for ZZZZ"),
        ({"ticker": "AAPL", "quantity": 0, "side": "buy"}, "Quantity must be positive"),
        ({"ticker": "AAPL", "quantity": 1, "side": "hold"}, "Invalid side: hold"),
    ],
)
def test_rejected_trades_return_400(client, payload, detail):
    response = client.post("/api/portfolio/trade", json=payload)
    assert response.status_code == 400
    assert response.json() == {"detail": detail}


def test_history_has_snapshot_after_trade(client):
    assert client.get("/api/portfolio/history").json() == []
    buy(client)
    history = client.get("/api/portfolio/history").json()
    assert len(history) == 1
    assert set(history[0]) == {"total_value", "recorded_at"}
