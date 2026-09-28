export interface Tile<T> {
  item: T;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Node<T> {
  item: T;
  area: number;
}

function worstRatio<T>(row: Node<T>[], side: number): number {
  const areas = row.map((n) => n.area);
  const sum = areas.reduce((a, b) => a + b, 0);
  const max = Math.max(...areas);
  const min = Math.min(...areas);
  return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
}

/** Squarified treemap layout. Returns tiles as percentages (0-100) of the container. */
export function treemap<T>(items: T[], value: (item: T) => number, width = 200, height = 100): Tile<T>[] {
  const total = items.reduce((sum, item) => sum + value(item), 0);
  if (total <= 0) return [];
  let nodes: Node<T>[] = items
    .map((item) => ({ item, area: (value(item) / total) * width * height }))
    .filter((n) => n.area > 0)
    .sort((a, b) => b.area - a.area);

  const tiles: Tile<T>[] = [];
  let rect = { x: 0, y: 0, w: width, h: height };
  while (nodes.length) {
    const side = Math.min(rect.w, rect.h);
    const row = [nodes[0]];
    let i = 1;
    while (i < nodes.length && worstRatio([...row, nodes[i]], side) <= worstRatio(row, side)) {
      row.push(nodes[i++]);
    }
    nodes = nodes.slice(i);

    const thickness = row.reduce((sum, n) => sum + n.area, 0) / side;
    const vertical = rect.w >= rect.h;
    let offset = 0;
    for (const n of row) {
      const length = n.area / thickness;
      tiles.push(
        vertical
          ? { item: n.item, x: rect.x, y: rect.y + offset, w: thickness, h: length }
          : { item: n.item, x: rect.x + offset, y: rect.y, w: length, h: thickness },
      );
      offset += length;
    }
    rect = vertical
      ? { x: rect.x + thickness, y: rect.y, w: rect.w - thickness, h: rect.h }
      : { x: rect.x, y: rect.y + thickness, w: rect.w, h: rect.h - thickness };
  }

  return tiles.map((t) => ({
    ...t,
    x: (t.x / width) * 100,
    y: (t.y / height) * 100,
    w: (t.w / width) * 100,
    h: (t.h / height) * 100,
  }));
}
