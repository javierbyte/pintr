import type { Coord } from './PINTR';

// Plain-text geometry export. The other two exports are pictures; this one is
// the raw path, so it can be converted to G-code, HPGL, or whatever else the
// user's machine wants without parsing an SVG.
//
// The file is nothing but coordinates — no header, no comments — so it drops
// straight into any parser. The canvas size they are measured against rides in
// the filename.

// A single line drawing is a chain where each segment starts where the previous
// one ended. Splitting where that breaks recovers the connected paths: a chain
// collapses to one path, loose segments stay as one two-point path each.
export function segmentsToPaths(coords: [Coord, Coord][]): Coord[][] {
  const paths: Coord[][] = [];
  let previousEnd: Coord | null = null;

  for (const [from, to] of coords) {
    if (
      !previousEnd ||
      from[0] !== previousEnd[0] ||
      from[1] !== previousEnd[1]
    ) {
      paths.push([from]);
    }
    paths[paths.length - 1].push(to);
    previousEnd = to;
  }

  return paths;
}

// One `x,y` per row; a blank line starts a new path (pen up, travel, pen down).
export function generateCoordsTxt(coords: [Coord, Coord][]) {
  const body = segmentsToPaths(coords)
    .map((path) => path.map((point) => point.join(',')).join('\n'))
    .join('\n\n');

  return body ? `${body}\n` : '';
}
