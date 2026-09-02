import type { PintrLine } from './types';

const SAMPLES = 4;
const SAMPLE_COUNT = SAMPLES * SAMPLES;
const EPSILON = 1e-9;

function countBits16(value: number) {
  value -= (value >>> 1) & 0x5555;
  value = (value & 0x3333) + ((value >>> 2) & 0x3333);
  value = (value + (value >>> 4)) & 0x0f0f;
  value += value >>> 8;
  return value & 0x1f;
}

// The browser strokes every buffered segment as one path, so overlaps are a
// union. A bit per sub-pixel keeps that union instead of blending twice.
export function createSource(
  width: number,
  height: number,
  initialGray: Uint8Array
) {
  const gray = new Uint8Array(initialGray);
  const coverage = new Uint16Array(width * height);
  const touched: number[] = [];

  function coverLine(line: PintrLine, strokeWidth: number) {
    const x1 = line[0][0];
    const y1 = line[0][1];
    const x2 = line[1][0];
    const y2 = line[1][1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);

    // A zero-length subpath with a butt cap paints nothing.
    if (!length) return;

    const half = strokeWidth / 2;
    const nx = (-dy / length) * half;
    const ny = (dx / length) * half;
    const xs = [x1 + nx, x2 + nx, x2 - nx, x1 - nx];
    const ys = [y1 + ny, y2 + ny, y2 - ny, y1 - ny];

    const minY = Math.max(0, Math.floor(Math.min(...ys) - 1));
    const maxY = Math.min(height - 1, Math.ceil(Math.max(...ys) + 1));

    for (let y = minY; y <= maxY; y++) {
      for (let sampleY = 0; sampleY < SAMPLES; sampleY++) {
        const py = y + (sampleY + 0.5) / SAMPLES;
        let left = Infinity;
        let right = -Infinity;

        for (let edge = 0; edge < 4; edge++) {
          const nextEdge = (edge + 1) % 4;
          const ay = ys[edge];
          const by = ys[nextEdge];

          if (!((ay <= py && by > py) || (by <= py && ay > py))) continue;

          const progress = (py - ay) / (by - ay);
          const px = xs[edge] + progress * (xs[nextEdge] - xs[edge]);
          left = Math.min(left, px);
          right = Math.max(right, px);
        }

        if (left === Infinity) continue;

        const minX = Math.max(0, Math.floor(left) - 1);
        const maxX = Math.min(width - 1, Math.ceil(right) + 1);

        for (let x = minX; x <= maxX; x++) {
          let bits = 0;

          for (let sampleX = 0; sampleX < SAMPLES; sampleX++) {
            const px = x + (sampleX + 0.5) / SAMPLES;
            if (px >= left - EPSILON && px <= right + EPSILON) {
              bits |= 1 << (sampleY * SAMPLES + sampleX);
            }
          }

          if (!bits) continue;

          const pixel = y * width + x;
          if (!coverage[pixel]) touched.push(pixel);
          coverage[pixel] |= bits;
        }
      }
    }
  }

  function erase(
    lines: readonly PintrLine[],
    strokeWidth: number,
    alpha: number
  ) {
    if (!lines.length || alpha <= 0 || strokeWidth <= 0) return;

    for (const line of lines) coverLine(line, strokeWidth);

    for (const pixel of touched) {
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      const grayIndex = x * height + y;
      const amount = (countBits16(coverage[pixel]) / SAMPLE_COUNT) * alpha;
      const current = gray[grayIndex];
      gray[grayIndex] = Math.round(current + (255 - current) * amount);
      coverage[pixel] = 0;
    }

    touched.length = 0;
  }

  return {
    gray,
    erase,
    snapshot() {
      return new Uint8Array(gray);
    },
  };
}
