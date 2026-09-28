"""Tests for watchlist endpoints."""


def tickers(client):
    return [row["ticker"] for row in client.get("/api/watchlist").json()]


def test_default_watchlist_has_prices(client):
    rows = client.get("/api/watchlist").json()
    assert len(rows) == 10
    assert set(rows[0]) == {"ticker", "price", "previous_price", "change_percent", "direction"}
    assert rows[0]["price"] is not None


def test_add_and_remove_ticker(client):
    response = client.post("/api/watchlist", json={"ticker": "pypl"})
    assert response.json() == {"ticker": "PYPL"}
    assert "PYPL" in tickers(client)
    assert client.app.state.price_cache.get_price("PYPL") is not None

    response = client.delete("/api/watchlist/pypl")
    assert response.json() == {"ticker": "PYPL"}
    assert "PYPL" not in tickers(client)


def test_add_duplicate_returns_400(client):
    response = client.post("/api/watchlist", json={"ticker": "AAPL"})
    assert response.status_code == 400


def test_add_blank_returns_400(client):
    response = client.post("/api/watchlist", json={"ticker": "  "})
    assert response.status_code == 400


def test_remove_missing_returns_404(client):
    response = client.delete("/api/watchlist/ZZZ")
    assert response.status_code == 404
