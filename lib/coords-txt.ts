import type { Coord } from './PINTR';

// Plain-text geometry export. The other two exports are pictures; this one is
// the raw path, so it can be converted to G-code, HPGL, or whatever else the
// user's machine wants without parsing an SVG.
//
// The file is nothing but coordinates — no header, no comments — so it drops
// straight into any parser. The one thing a reader cannot infer from the rows,
// the canvas the coordinates are measured against, rides in the filename.

function samePoint(a: Coord, b: Coord): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/**
 * Segments arrive as independent pairs, but single-line mode emits a chain
 * where each segment starts exactly where the previous one ended. Splitting on
 * that discontinuity recovers the connected paths without needing to know which
 * mode produced them: a chain collapses to one path, disjoint segments stay as
 * one two-point path each.
 */
export function segmentsToPaths(coords: [Coord, Coord][]): Coord[][] {
  const paths: Coord[][] = [];
  let current: Coord[] | null = null;
  let previousEnd: Coord | null = null;

  for (const [from, to] of coords) {
    if (!current || !previousEnd || !samePoint(from, previousEnd)) {
      current = [from];
      paths.push(current);
    }
    current.push(to);
    previousEnd = to;
  }

  return paths;
}

/** `PINTR-1080x1350.txt` — the pixel space the coordinates are measured in. */
export function coordsFileName(size: [number, number]) {
  return `PINTR-${size[0]}x${size[1]}.txt`;
}

/**
 * One `x,y` per row; a blank line starts a new path (pen up, travel, pen down).
 * Unlike the SVG renderers, which take only the start of each pair and so drop
 * the drawing's final endpoint, every generated point is written out.
 */
export function generateCoordsTxt(coords: [Coord, Coord][]) {
  const body = segmentsToPaths(coords)
    .map((path) => path.map((point) => `${point[0]},${point[1]}`).join('\n'))
    .join('\n\n');

  return body ? `${body}\n` : '';
}
