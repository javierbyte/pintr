import type { Coord } from './PINTR';

// Strokes `coords` on top of whatever is already in the canvas. A single line
// drawing is one connected path, so its corners get proper joins.
export function drawLines(
  ctx: CanvasRenderingContext2D,
  coords: [Coord, Coord][],
  { singleLine, strokeWidth }: { singleLine: boolean; strokeWidth: number }
) {
  ctx.beginPath();

  coords.forEach(([from, to], idx) => {
    if (!singleLine || idx === 0) ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
  });

  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#000';
  ctx.stroke();
}
