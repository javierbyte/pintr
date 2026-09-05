import { PintrError } from '../types';
import { toUint8Clamp, validateRgbaImage } from './shared';
import type { RgbaImage } from './types';

export function resizeRgbaImage(
  image: RgbaImage,
  {
    longestSide,
    allowUpscale = false,
  }: { longestSide: number; allowUpscale?: boolean }
): RgbaImage {
  validateRgbaImage(image);
  if (!Number.isInteger(longestSide) || longestSide <= 0) {
    throw new PintrError('resize longestSide must be a positive integer');
  }

  const scale = longestSide / Math.max(image.width, image.height);
  if (!allowUpscale && scale >= 1) {
    return {
      width: image.width,
      height: image.height,
      rgba: new Uint8ClampedArray(image.rgba),
    };
  }

  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const rgba = new Uint8ClampedArray(width * height * 4);

  if (scale >= 1) {
    // Enlarging: every output pixel sits between four source pixels, so pixel-
    // centre bilinear is the right filter and is deterministic.
    for (let y = 0; y < height; y++) {
      const sourceY = (y + 0.5) / scale - 0.5;
      const y0 = Math.max(0, Math.floor(sourceY));
      const y1 = Math.min(image.height - 1, y0 + 1);
      const fy = Math.max(0, sourceY - y0);

      for (let x = 0; x < width; x++) {
        const sourceX = (x + 0.5) / scale - 0.5;
        const x0 = Math.max(0, Math.floor(sourceX));
        const x1 = Math.min(image.width - 1, x0 + 1);
        const fx = Math.max(0, sourceX - x0);
        const target = (y * width + x) * 4;

        for (let channel = 0; channel < 4; channel++) {
          const topLeft = image.rgba[(y0 * image.width + x0) * 4 + channel];
          const topRight = image.rgba[(y0 * image.width + x1) * 4 + channel];
          const bottomLeft = image.rgba[(y1 * image.width + x0) * 4 + channel];
          const bottomRight = image.rgba[(y1 * image.width + x1) * 4 + channel];
          const top = topLeft * (1 - fx) + topRight * fx;
          const bottom = bottomLeft * (1 - fx) + bottomRight * fx;
          rgba[target + channel] = toUint8Clamp(top * (1 - fy) + bottom * fy);
        }
      }
    }

    return { width, height, rgba };
  }

  // Reducing: average the whole source rectangle each output pixel covers,
  // weighting the partial pixels at its edges. Bilinear only ever reads a 2x2
  // neighbourhood, so past ~0.5x it drops most of the source and aliases —
  // and PINTR traces that aliasing into real lines. Framing reaches 0.28x at
  // padding 25 with a tall ratio, well inside the range that matters.
  const spanX = image.width / width;
  const spanY = image.height / height;

  for (let y = 0; y < height; y++) {
    const top = y * spanY;
    const bottom = (y + 1) * spanY;
    const firstRow = Math.floor(top);
    const lastRow = Math.min(image.height - 1, Math.ceil(bottom) - 1);

    for (let x = 0; x < width; x++) {
      const left = x * spanX;
      const right = (x + 1) * spanX;
      const firstColumn = Math.floor(left);
      const lastColumn = Math.min(image.width - 1, Math.ceil(right) - 1);

      let red = 0;
      let green = 0;
      let blue = 0;
      let alpha = 0;
      let total = 0;

      for (let sourceY = firstRow; sourceY <= lastRow; sourceY++) {
        const weightY =
          Math.min(sourceY + 1, bottom) - Math.max(sourceY, top);
        if (weightY <= 0) continue;

        for (
          let sourceX = firstColumn;
          sourceX <= lastColumn;
          sourceX++
        ) {
          const weightX =
            Math.min(sourceX + 1, right) - Math.max(sourceX, left);
          if (weightX <= 0) continue;

          const weight = weightX * weightY;
          const source = (sourceY * image.width + sourceX) * 4;
          red += image.rgba[source] * weight;
          green += image.rgba[source + 1] * weight;
          blue += image.rgba[source + 2] * weight;
          alpha += image.rgba[source + 3] * weight;
          total += weight;
        }
      }

      const target = (y * width + x) * 4;
      rgba[target] = toUint8Clamp(red / total);
      rgba[target + 1] = toUint8Clamp(green / total);
      rgba[target + 2] = toUint8Clamp(blue / total);
      rgba[target + 3] = toUint8Clamp(alpha / total);
    }
  }

  return { width, height, rgba };
}
