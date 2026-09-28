import { describe, expect, it } from "vitest";
import { applyUpdates, emptyPriceState, MAX_POINTS } from "@/lib/priceStore";
import type { PriceUpdate } from "@/lib/types";

const tick = (price: number, previous: number, timestamp: number): Record<string, PriceUpdate> => ({
  AAPL: { ticker: "AAPL", price, previous_price: previous, timestamp, change: price - previous, change_percent: 0, direction: price > previous ? "up" : "down" },
});

describe("applyUpdates", () => {
  it("stores latest price, appends history, and pins session open", () => {
    let state = applyUpdates(emptyPriceState, tick(101, 100, 1));
    state = applyUpdates(state, tick(102, 101, 2));
    expect(state.prices.AAPL.price).toBe(102);
    expect(state.history.AAPL.map((p) => p.value)).toEqual([101, 102]);
    expect(state.sessionOpen.AAPL).toBe(100);
  });

  it("ignores repeated events with the same timestamp", () => {
    let state = applyUpdates(emptyPriceState, tick(101, 100, 1));
    state = applyUpdates(state, tick(101, 100, 1));
    expect(state.history.AAPL).toHaveLength(1);
  });

  it("caps history length", () => {
    let state = emptyPriceState;
    for (let i = 0; i < MAX_POINTS + 5; i++) state = applyUpdates(state, tick(100 + i, 100, i));
    expect(state.history.AAPL).toHaveLength(MAX_POINTS);
  });
});
