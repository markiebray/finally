import { formatMoney, formatPercent, formatPrice, formatQty, formatSigned, toneClass } from "@/lib/format";
import type { Position } from "@/lib/types";
import { Panel } from "./Panel";

interface PositionsTableProps {
  positions: Position[];
  onSelect: (ticker: string) => void;
}

const HEADERS = ["Ticker", "Qty", "Avg Cost", "Price", "Value", "Unrealized P&L", "%"];

export function PositionsTable({ positions, onSelect }: PositionsTableProps) {
  return (
    <Panel title="Positions" aside={<span className="text-[10px] text-muted">{positions.length} OPEN</span>} className="h-full">
      <div className="h-full overflow-auto">
        <table data-testid="positions-table" className="w-full text-sm">
          <thead className="sticky top-0 bg-panel">
            <tr className="border-b border-line text-right font-display text-[10px] uppercase tracking-[0.15em] text-muted">
              {HEADERS.map((h, i) => (
                <th key={h} className={`px-3 py-1.5 font-medium ${i === 0 ? "text-left" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
              <tr
                key={p.ticker}
                data-testid={`position-row-${p.ticker}`}
                onClick={() => onSelect(p.ticker)}
                className="cursor-pointer border-b border-line/50 text-right hover:bg-raised"
              >
                <td className="px-3 py-1 text-left font-display font-semibold tracking-wider">{p.ticker}</td>
                <td className="px-3 py-1">{formatQty(p.quantity)}</td>
                <td className="px-3 py-1 text-muted">{formatPrice(p.avg_cost)}</td>
                <td className="px-3 py-1">{formatPrice(p.current_price)}</td>
                <td className="px-3 py-1">{formatMoney(p.market_value)}</td>
                <td className={`px-3 py-1 ${toneClass(p.unrealized_pnl)}`}>{formatSigned(p.unrealized_pnl)}</td>
                <td className={`px-3 py-1 ${toneClass(p.pnl_percent)}`}>{formatPercent(p.pnl_percent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!positions.length && <p className="p-4 text-sm text-muted">No open positions. Place an order to get started.</p>}
      </div>
    </Panel>
  );
}
