import { describe, expect, it } from "vitest";
import { treemap } from "@/lib/treemap";
import { pnlColor } from "@/components/Heatmap";
import { toSeriesData } from "@/components/TimeChart";

describe("treemap", () => {
  it("tiles fill the container with areas proportional to value", () => {
    const tiles = treemap([{ v: 6 }, { v: 3 }, { v: 1 }], (d) => d.v);
    const areas = tiles.map((t) => (t.w * t.h) / 100);
    expect(areas[0]).toBeCloseTo(60);
    expect(areas[1]).toBeCloseTo(30);
    expect(areas[2]).toBeCloseTo(10);
    expect(areas.reduce((a, b) => a + b, 0)).toBeCloseTo(100);
  });

  it("returns nothing for empty or zero input", () => {
    expect(treemap([], () => 1)).toEqual([]);
    expect(treemap([{ v: 0 }], (d) => d.v)).toEqual([]);
  });
});

describe("pnlColor", () => {
  it("is green for profit, red for loss, gray for flat", () => {
    expect(pnlColor(2)).toMatch(/^rgba\(47, 208, 127/);
    expect(pnlColor(-2)).toMatch(/^rgba\(255, 84, 104/);
    expect(pnlColor(0)).toMatch(/^rgba\(107, 122, 143/);
  });
});

describe("toSeriesData", () => {
  it("floors to seconds, keeps last value per second, sorts ascending", () => {
    const data = toSeriesData([
      { time: 2.1, value: 5 },
      { time: 1.2, value: 1 },
      { time: 1.7, value: 2 },
    ]);
    expect(data).toEqual([{ time: 1, value: 2 }, { time: 2, value: 5 }]);
  });
});
