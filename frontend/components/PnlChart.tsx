import { useMemo } from "react";
import type { Snapshot } from "@/lib/types";
import { Panel } from "./Panel";
import { TimeChart } from "./TimeChart";

export function PnlChart({ history }: { history: Snapshot[] }) {
  const points = useMemo(
    () => history.map((s) => ({ time: Date.parse(s.recorded_at) / 1000, value: s.total_value })),
    [history],
  );

  return (
    <Panel title="Portfolio Value" className="h-full">
      <div data-testid="pnl-chart" data-points={points.length} className="h-full">
        {points.length ? (
          <TimeChart points={points} color="#209dd7" />
        ) : (
          <p className="p-4 text-sm text-muted">No snapshots yet.</p>
        )}
      </div>
    </Panel>
  );
}
