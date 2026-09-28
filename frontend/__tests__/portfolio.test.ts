import { describe, expect, it } from "vitest";
import { livePortfolio, repricePosition } from "@/lib/portfolio";
import type { Portfolio, PriceUpdate } from "@/lib/types";

const portfolio: Portfolio = {
  cash: 8100,
  total_value: 10000,
  positions_value: 1900,
  unrealized_pnl: 0,
  positions: [
    { ticker: "AAPL", quantity: 10, avg_cost: 190, current_price: 190, market_value: 1900, unrealized_pnl: 0, pnl_percent: 0 },
  ],
};

const update = (ticker: string, price: number): PriceUpdate => ({
  ticker, price, previous_price: price, timestamp: 1, change: 0, change_percent: 0, direction: "flat",
});

describe("repricePosition", () => {
  it("computes market value and P&L at the new price", () => {
    const p = repricePosition(portfolio.positions[0], 171);
    expect(p.market_value).toBe(1710);
    expect(p.unrealized_pnl).toBe(-190);
    expect(p.pnl_percent).toBeCloseTo(-10);
  });

  it("keeps the server price when no streamed price exists", () => {
    expect(repricePosition(portfolio.positions[0], undefined).current_price).toBe(190);
  });
});

describe("livePortfolio", () => {
  it("recomputes totals from streamed prices", () => {
    const live = livePortfolio(portfolio, { AAPL: update("AAPL", 200) });
    expect(live.positions_value).toBe(2000);
    expect(live.unrealized_pnl).toBe(100);
    expect(live.total_value).toBe(10100);
    expect(live.cash).toBe(8100);
  });
});
