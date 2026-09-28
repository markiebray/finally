import { test, expect } from "@playwright/test";

test("health check returns ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
});

test("portfolio has the contract shape", async ({ request }) => {
  const res = await request.get("/api/portfolio");
  expect(res.status()).toBe(200);
  const body = await res.json();
  for (const key of ["cash", "total_value", "positions_value", "unrealized_pnl", "positions"]) {
    expect(body).toHaveProperty(key);
  }
  expect(Array.isArray(body.positions)).toBe(true);
});

test("watchlist lists tickers with price fields", async ({ request }) => {
  const res = await request.get("/api/watchlist");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.length).toBeGreaterThan(0);
  expect(body[0]).toHaveProperty("ticker");
  expect(body[0]).toHaveProperty("price");
});

test("buying with insufficient cash is rejected", async ({ request }) => {
  const res = await request.post("/api/portfolio/trade", {
    data: { ticker: "AAPL", quantity: 1_000_000, side: "buy" },
  });
  expect(res.status()).toBe(400);
  expect((await res.json()).detail).toMatch(/insufficient cash/i);
});

test("selling shares not owned is rejected", async ({ request }) => {
  const res = await request.post("/api/portfolio/trade", {
    data: { ticker: "JPM", quantity: 1_000_000, side: "sell" },
  });
  expect(res.status()).toBe(400);
  expect((await res.json()).detail).toMatch(/insufficient shares/i);
});

test("buy then sell round trip via API", async ({ request }) => {
  const buy = await request.post("/api/portfolio/trade", {
    data: { ticker: "v", quantity: 1, side: "buy" },
  });
  expect(buy.status()).toBe(200);
  const bought = await buy.json();
  expect(bought.trade).toMatchObject({ ticker: "V", side: "buy", quantity: 1 });
  expect(bought.portfolio.positions.some((p: { ticker: string }) => p.ticker === "V")).toBe(true);

  const sell = await request.post("/api/portfolio/trade", {
    data: { ticker: "V", quantity: 1, side: "sell" },
  });
  expect(sell.status()).toBe(200);
  expect((await sell.json()).trade).toMatchObject({ ticker: "V", side: "sell", quantity: 1 });
});

test("portfolio history returns snapshots", async ({ request }) => {
  const res = await request.get("/api/portfolio/history");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.length).toBeGreaterThan(0);
  expect(body[0]).toHaveProperty("total_value");
  expect(body[0]).toHaveProperty("recorded_at");
});

test("watchlist add duplicate is 400 and remove missing is 404", async ({ request }) => {
  const add = await request.post("/api/watchlist", { data: { ticker: "aapl" } });
  expect(add.status()).toBe(400);
  const del = await request.delete("/api/watchlist/NOPE");
  expect(del.status()).toBe(404);
});

test("chat in mock mode executes a trade", async ({ request }) => {
  const res = await request.post("/api/chat", { data: { message: "buy 1 TSLA" } });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.message).toContain("Done (mock)");
  expect(body.trades[0]).toMatchObject({ ticker: "TSLA", side: "buy", quantity: 1, status: "executed" });
});

test("chat reports a failed trade in errors", async ({ request }) => {
  const res = await request.post("/api/chat", { data: { message: "sell 100000 NFLX" } });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.errors.join(" ")).toMatch(/insufficient shares/i);
});

test("chat history includes the user and assistant messages", async ({ request }) => {
  const text = `history check ${Date.now()}`;
  expect((await request.post("/api/chat", { data: { message: text } })).status()).toBe(200);

  const res = await request.get("/api/chat");
  expect(res.status()).toBe(200);
  const history: { role: string; content: string }[] = await res.json();
  const i = history.findIndex((m) => m.role === "user" && m.content === text);
  expect(i).toBeGreaterThanOrEqual(0);
  expect(history[i + 1]).toMatchObject({ role: "assistant", content: expect.stringContaining("mock mode") });
});
