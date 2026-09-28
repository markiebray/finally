import { formatPercent, formatPrice, toneClass } from "@/lib/format";
import type { PricePoint, PriceUpdate } from "@/lib/types";
import { Sparkline } from "./Sparkline";

interface WatchlistRowProps {
  ticker: string;
  update?: PriceUpdate;
  fallbackPrice: number | null;
  sessionOpen?: number;
  points: PricePoint[];
  selected: boolean;
  onSelect: (ticker: string) => void;
  onRemove: (ticker: string) => void;
}

export function WatchlistRow({ ticker, update, fallbackPrice, sessionOpen, points, selected, onSelect, onRemove }: WatchlistRowProps) {
  const price = update?.price ?? fallbackPrice;
  const change = price !== null && sessionOpen ? ((price - sessionOpen) / sessionOpen) * 100 : 0;
  const flash = update && update.direction !== "flat" ? `flash-${update.direction}` : "";

  return (
    <li
      data-testid={`watchlist-row-${ticker}`}
      onClick={() => onSelect(ticker)}
      className={`group grid cursor-pointer grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-line/60 border-l-2 px-3 py-1.5 transition-colors hover:bg-raised ${
        selected ? "border-l-blue bg-blue/10" : "border-l-transparent"
      }`}
    >
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="font-display text-sm font-semibold tracking-wider">{ticker}</span>
        <span className={`text-[11px] ${toneClass(change)}`}>{formatPercent(change)}</span>
      </div>
      <Sparkline points={points} />
      <div className="flex items-center gap-1">
        <span
          key={update?.timestamp}
          data-testid={`price-${ticker}`}
          className={`min-w-[4.5rem] rounded-sm px-1 text-right text-sm ${flash}`}
        >
          {price === null ? "—" : formatPrice(price)}
        </span>
        <button
          data-testid={`watchlist-remove-${ticker}`}
          aria-label={`Remove ${ticker}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(ticker);
          }}
          className="w-4 text-muted opacity-0 transition-opacity hover:text-down group-hover:opacity-100 focus:opacity-100"
        >
          ×
        </button>
      </div>
    </li>
  );
}
