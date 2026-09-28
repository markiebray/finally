import type { PricePoint, PriceUpdate } from "./types";

export const MAX_POINTS = 600;

export interface PriceState {
  prices: Record<string, PriceUpdate>;
  history: Record<string, PricePoint[]>;
  sessionOpen: Record<string, number>;
}

export const emptyPriceState: PriceState = { prices: {}, history: {}, sessionOpen: {} };

/** Merge a batch of streamed updates into the price state. */
export function applyUpdates(state: PriceState, batch: Record<string, PriceUpdate>): PriceState {
  const prices = { ...state.prices };
  const history = { ...state.history };
  const sessionOpen = { ...state.sessionOpen };
  for (const update of Object.values(batch)) {
    const { ticker, price, timestamp } = update;
    const last = prices[ticker];
    prices[ticker] = update;
    sessionOpen[ticker] ??= update.previous_price || price;
    if (last?.timestamp === timestamp) continue;
    history[ticker] = [...(history[ticker] ?? []), { time: timestamp, value: price }].slice(-MAX_POINTS);
  }
  return { prices, history, sessionOpen };
}
