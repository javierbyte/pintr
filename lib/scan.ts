import type { Coord } from './PINTR';

export function scanLine(from: Coord, to: Coord, matrix: Uint8Array[]) {
  let total = 0;

  const x = from[0];
  const lengthX = to[0] - from[0];

  const y = from[1];
  const lengthY = to[1] - from[1];

  const precision = Math.max(Math.abs(lengthX), Math.abs(lengthY));

  for (let i = 0; i < precision; i++) {
    const scanX = Math.round(x + (lengthX / precision) * i);
    const scanY = Math.round(y + (lengthY / precision) * i);
    total += matrix[scanX][scanY];
  }

  return Math.round(total / precision);
}

export function scanLineUint8(
  from: Coord,
  to: Coord,
  arr: number[],
  width: number
) {
  let total = 0;

  const x = from[0];
  const lengthX = to[0] - from[0];

  const y = from[1];
  const lengthY = to[1] - from[1];

  const precision = Math.max(Math.abs(lengthX), Math.abs(lengthY));

  for (let i = 0; i < precision; i++) {
    const scanX = Math.round(x + (lengthX / precision) * i);
    const scanY = Math.round(y + (lengthY / precision) * i);
    total += arr[scanX * width + scanY];
  }

  return Math.round(total / precision);
}
