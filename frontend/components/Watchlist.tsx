"use client";

import { useState, type FormEvent } from "react";
import type { PricePoint, PriceUpdate, WatchlistItem } from "@/lib/types";
import { Panel } from "./Panel";
import { WatchlistRow } from "./WatchlistRow";

interface WatchlistProps {
  items: WatchlistItem[];
  prices: Record<string, PriceUpdate>;
  history: Record<string, PricePoint[]>;
  sessionOpen: Record<string, number>;
  selected: string | null;
  onSelect: (ticker: string) => void;
  onAdd: (ticker: string) => Promise<void>;
  onRemove: (ticker: string) => void;
}

export function Watchlist({ items, prices, history, sessionOpen, selected, onSelect, onAdd, onRemove }: WatchlistProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const ticker = draft.trim().toUpperCase();
    if (!ticker) return;
    try {
      await onAdd(ticker);
      setDraft("");
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Panel title="Watchlist" aside={<span className="text-[10px] text-muted">{items.length} SYM</span>} className="h-full">
      <div className="flex h-full flex-col">
        <ul data-testid="watchlist" className="min-h-0 flex-1 overflow-y-auto">
          {items.map((item) => (
            <WatchlistRow
              key={item.ticker}
              ticker={item.ticker}
              update={prices[item.ticker]}
              fallbackPrice={item.price}
              sessionOpen={sessionOpen[item.ticker]}
              points={history[item.ticker] ?? []}
              selected={item.ticker === selected}
              onSelect={onSelect}
              onRemove={onRemove}
            />
          ))}
        </ul>
        <form onSubmit={submit} className="shrink-0 border-t border-line p-2">
          <div className="flex gap-1.5">
            <input
              data-testid="watchlist-add-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="ADD TICKER"
              maxLength={10}
              className="min-w-0 flex-1 border border-line bg-bg px-2 py-1 text-sm uppercase outline-none placeholder:text-muted/60 focus:border-blue"
            />
            <button
              data-testid="watchlist-add-button"
              type="submit"
              className="border border-blue/60 px-3 font-display text-xs font-semibold tracking-widest text-blue hover:bg-blue/15"
            >
              ADD
            </button>
          </div>
          {error && <p data-testid="watchlist-error" className="mt-1 text-[11px] text-down">{error}</p>}
        </form>
      </div>
    </Panel>
  );
}
