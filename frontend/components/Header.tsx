import { formatMoney, formatSigned, toneClass } from "@/lib/format";
import type { ConnectionStatus } from "@/lib/types";

const STATUS_STYLE: Record<ConnectionStatus, string> = {
  connected: "bg-up shadow-[0_0_8px_var(--color-up)]",
  reconnecting: "bg-accent pulse-dot",
  disconnected: "bg-down",
};

interface HeaderProps {
  totalValue: number | null;
  cash: number | null;
  pnl: number | null;
  status: ConnectionStatus;
}

function Stat({ label, testId, value, className = "" }: { label: string; testId: string; value: string; className?: string }) {
  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="font-display text-[10px] uppercase tracking-[0.2em] text-muted">{label}</span>
      <span data-testid={testId} className={`text-sm font-semibold ${className}`}>
        {value}
      </span>
    </div>
  );
}

export function Header({ totalValue, cash, pnl, status }: HeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-panel/80 px-4">
      <div className="flex items-baseline gap-3">
        <h1 className="font-display text-xl font-bold tracking-[0.12em] text-text">
          FIN<span className="text-accent">ALLY</span>
        </h1>
        <span className="hidden font-display text-[10px] uppercase tracking-[0.3em] text-muted md:inline">
          AI Trading Workstation
        </span>
      </div>
      <div className="flex items-center gap-6">
        <Stat label="Portfolio" testId="total-value" value={totalValue === null ? "—" : formatMoney(totalValue)} className="text-accent" />
        <Stat label="Cash" testId="cash-balance" value={cash === null ? "—" : formatMoney(cash)} />
        <Stat label="Unrealized" testId="unrealized-pnl" value={pnl === null ? "—" : formatSigned(pnl)} className={toneClass(pnl ?? 0)} />
        <div className="flex items-center gap-2 border-l border-line pl-5" title={`Stream ${status}`}>
          <span data-testid="connection-status" data-status={status} className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLE[status]}`} />
          <span className="font-display text-[10px] uppercase tracking-[0.2em] text-muted">{status}</span>
        </div>
      </div>
    </header>
  );
}
