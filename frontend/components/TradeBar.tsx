"use client";

import { useState } from "react";
import type { Side } from "@/lib/types";

interface TradeBarProps {
  ticker: string;
  onTickerChange: (ticker: string) => void;
  onTrade: (ticker: string, quantity: number, side: Side) => Promise<void>;
}

export function TradeBar({ ticker, onTickerChange, onTrade }: TradeBarProps) {
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function trade(side: Side) {
    const qty = Number(quantity);
    if (!ticker || !(qty > 0)) {
      setError("Enter a ticker and a positive quantity");
      return;
    }
    setBusy(true);
    try {
      await onTrade(ticker.toUpperCase(), qty, side);
      setError("");
      setQuantity("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const input = "border border-line bg-bg px-2 py-1.5 text-sm uppercase outline-none placeholder:text-muted/60 focus:border-blue";
  const button = "px-5 py-1.5 font-display text-xs font-bold tracking-[0.2em] text-white transition disabled:opacity-40";

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border border-line bg-panel/90 px-3 py-2">
      <span className="mr-1 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Order</span>
      <input
        data-testid="trade-ticker"
        value={ticker}
        onChange={(e) => onTickerChange(e.target.value.toUpperCase())}
        placeholder="TICKER"
        maxLength={10}
        className={`${input} w-28`}
      />
      <input
        data-testid="trade-quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="QTY"
        type="number"
        min="0"
        step="any"
        className={`${input} w-28`}
      />
      <button data-testid="trade-buy" disabled={busy} onClick={() => trade("buy")} className={`${button} bg-purple hover:brightness-125`}>
        BUY
      </button>
      <button
        data-testid="trade-sell"
        disabled={busy}
        onClick={() => trade("sell")}
        className={`${button} border border-purple bg-transparent text-purple-200 hover:bg-purple/25`}
      >
        SELL
      </button>
      <span className="text-[11px] text-muted">MKT · instant fill</span>
      {error && <span data-testid="trade-error" className="ml-auto text-xs text-down">{error}</span>}
    </div>
  );
}
