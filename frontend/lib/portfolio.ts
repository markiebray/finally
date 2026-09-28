import type { Portfolio, Position, PriceUpdate } from "./types";

/** Reprice a position at the latest streamed price. */
export function repricePosition(position: Position, price: number | undefined): Position {
  const current = price ?? position.current_price;
  const cost = position.avg_cost * position.quantity;
  const market = current * position.quantity;
  return {
    ...position,
    current_price: current,
    market_value: market,
    unrealized_pnl: market - cost,
    pnl_percent: cost ? ((market - cost) / cost) * 100 : 0,
  };
}

/** Recompute portfolio totals using the latest streamed prices. */
export function livePortfolio(portfolio: Portfolio, prices: Record<string, PriceUpdate>): Portfolio {
  const positions = portfolio.positions.map((p) => repricePosition(p, prices[p.ticker]?.price));
  const positionsValue = positions.reduce((sum, p) => sum + p.market_value, 0);
  const pnl = positions.reduce((sum, p) => sum + p.unrealized_pnl, 0);
  return {
    cash: portfolio.cash,
    positions,
    positions_value: positionsValue,
    unrealized_pnl: pnl,
    total_value: portfolio.cash + positionsValue,
  };
}
