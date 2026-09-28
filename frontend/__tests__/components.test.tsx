import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Header } from "@/components/Header";
import { Heatmap } from "@/components/Heatmap";
import { PositionsTable } from "@/components/PositionsTable";
import { Watchlist } from "@/components/Watchlist";
import { WatchlistRow } from "@/components/WatchlistRow";
import type { Position, PriceUpdate } from "@/lib/types";

const update = (price: number, previous: number, timestamp: number): PriceUpdate => ({
  ticker: "AAPL", price, previous_price: previous, timestamp, change: price - previous, change_percent: 0,
  direction: price > previous ? "up" : price < previous ? "down" : "flat",
});

const position: Position = {
  ticker: "AAPL", quantity: 10, avg_cost: 190, current_price: 195, market_value: 1950, unrealized_pnl: 50, pnl_percent: 2.63,
};

function renderRow(u?: PriceUpdate) {
  const props = { ticker: "AAPL", fallbackPrice: 190, sessionOpen: 190, points: [], selected: false, onSelect: vi.fn(), onRemove: vi.fn() };
  const view = render(<WatchlistRow {...props} update={u} />);
  return { ...view, rerenderWith: (next: PriceUpdate) => view.rerender(<WatchlistRow {...props} update={next} />), props };
}

describe("WatchlistRow", () => {
  it("shows the fallback price before streaming starts", () => {
    renderRow();
    expect(screen.getByTestId("price-AAPL")).toHaveTextContent("190.00");
  });

  it("flashes green on uptick and red on downtick", () => {
    const { rerenderWith } = renderRow(update(191, 190, 1));
    expect(screen.getByTestId("price-AAPL")).toHaveClass("flash-up");
    rerenderWith(update(189, 191, 2));
    expect(screen.getByTestId("price-AAPL")).toHaveClass("flash-down");
    expect(screen.getByTestId("price-AAPL")).toHaveTextContent("189.00");
  });

  it("does not flash on an unchanged price", () => {
    renderRow(update(190, 190, 1));
    expect(screen.getByTestId("price-AAPL").className).not.toMatch(/flash/);
  });

  it("selects on click and removes without selecting", async () => {
    const { props } = renderRow();
    await userEvent.click(screen.getByTestId("watchlist-remove-AAPL"));
    expect(props.onRemove).toHaveBeenCalledWith("AAPL");
    expect(props.onSelect).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("watchlist-row-AAPL"));
    expect(props.onSelect).toHaveBeenCalledWith("AAPL");
  });
});

describe("Watchlist", () => {
  const base = { prices: {}, history: {}, sessionOpen: {}, selected: null, onSelect: vi.fn(), onRemove: vi.fn() };
  const items = [{ ticker: "AAPL", price: 190, previous_price: 190, change_percent: 0, direction: "flat" as const }];

  it("adds an upper-cased ticker", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<Watchlist {...base} items={items} onAdd={onAdd} />);
    await userEvent.type(screen.getByTestId("watchlist-add-input"), "pypl");
    await userEvent.click(screen.getByTestId("watchlist-add-button"));
    expect(onAdd).toHaveBeenCalledWith("PYPL");
    expect(screen.getByTestId("watchlist-add-input")).toHaveValue("");
  });

  it("shows the server error when add fails", async () => {
    const onAdd = vi.fn().mockRejectedValue(new Error("Already in watchlist"));
    render(<Watchlist {...base} items={items} onAdd={onAdd} />);
    await userEvent.type(screen.getByTestId("watchlist-add-input"), "AAPL{enter}");
    expect(await screen.findByTestId("watchlist-error")).toHaveTextContent("Already in watchlist");
  });
});

describe("Header", () => {
  it("renders values and connection status", () => {
    render(<Header totalValue={10050.2} cash={8100} pnl={50.2} status="reconnecting" />);
    expect(screen.getByTestId("total-value")).toHaveTextContent("$10,050.20");
    expect(screen.getByTestId("cash-balance")).toHaveTextContent("$8,100.00");
    expect(screen.getByTestId("connection-status")).toHaveAttribute("data-status", "reconnecting");
  });
});

describe("PositionsTable", () => {
  it("renders a row per position with P&L", () => {
    render(<PositionsTable positions={[position]} onSelect={vi.fn()} />);
    const row = screen.getByTestId("position-row-AAPL");
    expect(row).toHaveTextContent("10");
    expect(row).toHaveTextContent("+$50.00");
    expect(row).toHaveTextContent("+2.63%");
  });
});

describe("Heatmap", () => {
  it("renders a tile per position", () => {
    render(<Heatmap positions={[position, { ...position, ticker: "TSLA", unrealized_pnl: -5, pnl_percent: -1 }]} onSelect={vi.fn()} />);
    expect(screen.getByTestId("heatmap-tile-AAPL")).toBeInTheDocument();
    expect(screen.getByTestId("heatmap-tile-TSLA")).toBeInTheDocument();
  });
});
