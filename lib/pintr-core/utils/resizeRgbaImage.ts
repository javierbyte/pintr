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

  // Pixel-center bilinear sampling is deterministic and deliberately lives in
  // utils; the browser may keep drawImage when matching its current pixels.
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
        rgba[target + channel] = toUint8Clamp(
          top * (1 - fy) + bottom * fy
        );
      }
    }
  }

  return { width, height, rgba };
}
