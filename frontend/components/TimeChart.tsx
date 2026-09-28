"use client";

import { useEffect, useRef } from "react";
import { AreaSeries, ColorType, createChart, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import type { PricePoint } from "@/lib/types";

/** Floor times to whole seconds and keep the last value per second (chart needs strictly ascending times). */
export function toSeriesData(points: PricePoint[]) {
  const bySecond = new Map<number, number>();
  for (const p of points) bySecond.set(Math.floor(p.time), p.value);
  return [...bySecond].sort((a, b) => a[0] - b[0]).map(([time, value]) => ({ time: time as UTCTimestamp, value }));
}

interface TimeChartProps {
  points: PricePoint[];
  color: string;
}

/** Canvas area chart (Lightweight Charts) that fills its container. */
export function TimeChart({ points, color }: TimeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    const chart = createChart(containerRef.current!, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#6b7a8f",
        fontFamily: getComputedStyle(document.body).fontFamily,
        fontSize: 10,
        attributionLogo: false,
      },
      grid: { vertLines: { color: "#1a2330" }, horzLines: { color: "#1a2330" } },
      rightPriceScale: { borderColor: "#222c3a" },
      timeScale: { borderColor: "#222c3a", timeVisible: true, secondsVisible: true },
      crosshair: { vertLine: { color: "#ecad0a55" }, horzLine: { color: "#ecad0a55" } },
    });
    chartRef.current = chart;
    seriesRef.current = chart.addSeries(AreaSeries, { lineWidth: 2 });
    return () => chart.remove();
  }, []);

  useEffect(() => {
    seriesRef.current?.applyOptions({ lineColor: color, topColor: `${color}55`, bottomColor: `${color}00` });
  }, [color]);

  useEffect(() => {
    seriesRef.current?.setData(toSeriesData(points));
    chartRef.current?.timeScale().fitContent();
  }, [points]);

  return <div ref={containerRef} className="h-full w-full" />;
}
