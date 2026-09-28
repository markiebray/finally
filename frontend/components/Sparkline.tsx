import type { PricePoint } from "@/lib/types";

interface SparklineProps {
  points: PricePoint[];
  width?: number;
  height?: number;
}

/** Tiny SVG line of recent prices, colored by direction since the first point. */
export function Sparkline({ points, width = 72, height = 22 }: SparklineProps) {
  if (points.length < 2) return <svg width={width} height={height} aria-hidden />;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const step = width / (points.length - 1);
  const path = values
    .map((v, i) => `${(i * step).toFixed(1)},${(height - 1 - ((v - min) / range) * (height - 2)).toFixed(1)}`)
    .join(" ");
  const up = values[values.length - 1] >= values[0];
  return (
    <svg width={width} height={height} aria-hidden data-testid="sparkline">
      <polyline points={path} fill="none" strokeWidth={1.25} stroke={up ? "var(--color-up)" : "var(--color-down)"} />
    </svg>
  );
}
