import type { Coord } from './PINTR';

import { tweenValue } from './utils';

export type SmoothSegment = { cps: Coord; cpe: Coord; point: Coord };

// Compute cubic-bezier control points that smooth a polyline through `points`.
// Shared by the SVG export and the on-screen canvas render so both look identical.
export function smoothControlPoints(
  points: Coord[],
  smoothingAmount = 50
): SmoothSegment[] {
  const calculatedSmoothing = tweenValue(smoothingAmount, [
    [0, 0],
    [50, 0.1],
    [100, 1],
  ]);

  const line = (pointA: Coord, pointB: Coord) => {
    const lengthX = pointB[0] - pointA[0];
    const lengthY = pointB[1] - pointA[1];
    return {
      length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
      angle: Math.atan2(lengthY, lengthX),
    };
  };

  // The control point position is relative to the current point.
  const controlPoint = (
    current: Coord,
    previous: Coord,
    next: Coord,
    reverse?: boolean
  ): Coord => {
    const p = previous || current;
    const n = next || current;
    const o = line(p, n);
    const angle = o.angle + (reverse ? Math.PI : 0);
    const length = o.length * calculatedSmoothing;
    return [current[0] + Math.cos(angle) * length, current[1] + Math.sin(angle) * length];
  };

  const segments: SmoothSegment[] = [];
  for (let i = 1; i < points.length; i++) {
    const cps = controlPoint(points[i - 1], points[i - 2], points[i]);
    const cpe = controlPoint(points[i], points[i - 1], points[i + 1], true);
    segments.push({ cps, cpe, point: points[i] });
  }
  return segments;
}

export function generateSmoothSvg(
  coords: [Coord, Coord][],
  {
    smoothingAmount = 50,
    strokeWidth = 1,
    size,
    whiteBackground,
  }: {
    smoothingAmount: number;
    strokeWidth?: number;
    size: [number, number];
    whiteBackground?: boolean;
  }
) {
  const points = coords.map((coord) => coord[0]);
  const segments = smoothControlPoints(points, smoothingAmount);

  const d = points.length
    ? `M ${points[0][0]},${points[0][1]} ` +
      segments
        .map(
          (s) =>
            `C ${s.cps[0]},${s.cps[1]} ${s.cpe[0]},${s.cpe[1]} ${s.point[0]},${s.point[1]}`
        )
        .join(' ')
    : '';

  const path = `<path d="${d}" fill="none" stroke="black" stroke-width="${strokeWidth}" />`;

  const background = whiteBackground
    ? `<rect width="${size[0]}" height="${size[1]}" fill="#fff"/>\n    `
    : '';

  return `<svg viewBox="0 0 ${size[0]} ${
    size[1]
  }" xmlns="http://www.w3.org/2000/svg" stroke="black">
    ${background}${path}
  </svg>
  `;
}
