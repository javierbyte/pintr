import type { Coord } from './PINTR';
import { smoothControlPoints } from './smooth-svg';

// Re-draw the visible canvas from the finished coords. When smoothing is active
// (single-line drawings only) the path is rendered as a smooth bezier curve so the
// smoothing slider is visible on screen (and in the PNG export, which reads this canvas).
export function renderCoordsToCanvas(
  ctx: CanvasRenderingContext2D,
  coords: [Coord, Coord][],
  {
    smoothingAmount,
    singleLine,
    strokeWidth,
  }: { smoothingAmount: number; singleLine: boolean; strokeWidth: number }
) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();

  if (singleLine && smoothingAmount > 0) {
    const points = coords.map((coord) => coord[0]);
    if (points.length) {
      const segments = smoothControlPoints(points, smoothingAmount);
      ctx.moveTo(points[0][0], points[0][1]);
      for (const s of segments) {
        ctx.bezierCurveTo(
          s.cps[0],
          s.cps[1],
          s.cpe[0],
          s.cpe[1],
          s.point[0],
          s.point[1]
        );
      }
    }
  } else {
    for (const [from, to] of coords) {
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(to[0], to[1]);
    }
  }

  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = '#000';
  ctx.stroke();
}
