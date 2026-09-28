import { formatPercent } from "@/lib/format";
import { treemap } from "@/lib/treemap";
import type { Position } from "@/lib/types";
import { Panel } from "./Panel";

const FULL_SCALE_PCT = 5;

/** Green for profit, red for loss; intensity grows with |P&L %| up to ±5%. */
export function pnlColor(pnlPercent: number): string {
  const strength = Math.min(Math.abs(pnlPercent) / FULL_SCALE_PCT, 1);
  const alpha = (0.18 + strength * 0.62).toFixed(2);
  if (pnlPercent > 0) return `rgba(47, 208, 127, ${alpha})`;
  if (pnlPercent < 0) return `rgba(255, 84, 104, ${alpha})`;
  return "rgba(107, 122, 143, 0.25)";
}

interface HeatmapProps {
  positions: Position[];
  onSelect: (ticker: string) => void;
}

export function Heatmap({ positions, onSelect }: HeatmapProps) {
  const tiles = treemap(positions, (p) => p.market_value);

  return (
    <Panel title="Heatmap" className="h-full">
      <div data-testid="heatmap" className="relative h-full overflow-hidden">
        {tiles.map(({ item, x, y, w, h }) => (
          <button
            key={item.ticker}
            data-testid={`heatmap-tile-${item.ticker}`}
            onClick={() => onSelect(item.ticker)}
            className="absolute flex flex-col items-center justify-center overflow-hidden border border-bg text-center transition hover:brightness-125"
            style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, backgroundColor: pnlColor(item.pnl_percent) }}
          >
            <span className="font-display text-sm font-bold tracking-wider">{item.ticker}</span>
            <span className="text-[11px]">{formatPercent(item.pnl_percent)}</span>
          </button>
        ))}
        {!tiles.length && <p className="p-4 text-sm text-muted">Positions will appear here.</p>}
      </div>
    </Panel>
  );
}
