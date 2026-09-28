import { formatPercent, formatPrice, toneClass } from "@/lib/format";
import type { PricePoint, PriceUpdate } from "@/lib/types";
import { Panel } from "./Panel";
import { TimeChart } from "./TimeChart";

interface MainChartProps {
  ticker: string | null;
  points: PricePoint[];
  update?: PriceUpdate;
  sessionOpen?: number;
}

export function MainChart({ ticker, points, update, sessionOpen }: MainChartProps) {
  const change = update && sessionOpen ? ((update.price - sessionOpen) / sessionOpen) * 100 : 0;
  const color = change >= 0 ? "#2fd07f" : "#ff5468";

  return (
    <Panel title={ticker ? `Chart · ${ticker}` : "Chart"} className="h-full">
      <div data-testid="main-chart" data-ticker={ticker ?? ""} className="relative h-full">
        {ticker && update && (
          <div className="pointer-events-none absolute left-3 top-2 z-10 flex items-baseline gap-3">
            <span className="font-display text-2xl font-bold tracking-wider">{ticker}</span>
            <span className="text-xl">{formatPrice(update.price)}</span>
            <span className={`text-sm ${toneClass(change)}`}>{formatPercent(change)} session</span>
          </div>
        )}
        {ticker ? (
          <TimeChart points={points} color={color} />
        ) : (
          <p className="p-4 text-sm text-muted">Select a ticker from the watchlist.</p>
        )}
      </div>
    </Panel>
  );
}
