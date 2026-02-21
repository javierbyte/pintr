import type { Coord } from './PINTR';

export function scanLine(from: Coord, to: Coord, matrix: Uint8Array[]) {
  let total = 0;

  const x = from[0];
  const lengthX = to[0] - from[0];

  const y = from[1];
  const lengthY = to[1] - from[1];

  const precision = Math.max(Math.abs(lengthX), Math.abs(lengthY));
  const stepX = lengthX / precision;
  const stepY = lengthY / precision;

  for (let i = 0; i < precision; i++) {
    const scanX = Math.round(x + stepX * i);
    const scanY = Math.round(y + stepY * i);
    total += matrix[scanX][scanY];
  }

  return Math.round(total / precision);
}
