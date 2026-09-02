import type { PintrPoint } from './types';

export function scanLine(
  from: PintrPoint,
  to: PintrPoint,
  gray: Uint8Array,
  height: number
) {
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
    total += gray[scanX * height + scanY];
  }

  return Math.round(total / precision);
}
