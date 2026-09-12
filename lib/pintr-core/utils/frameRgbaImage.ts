import { PintrError } from '../types';
import { extendRgbaImage } from './extendRgbaImage';
import { resizeRgbaImage } from './resizeRgbaImage';
import { clamp, validateRgbaImage } from './shared';
import type { RgbaImage } from './types';

export type FrameOptions = {
  // width / height of the output canvas; null keeps the source ratio.
  aspectRatio: number | null;
  // 0-100, percent of the canvas short side, inset on each of the four sides.
  padding: number;
  // Fill the space around the picture with a blurred continuation of it
  // instead of leaving it white.
  extend?: boolean;
};

// Place the image, contained (never cropped, never stretched), on an opaque
// white canvas of the requested aspect ratio. The ratio alone decides the output
// dimensions: padding insets the picture inside that canvas instead of growing
// it, so the ratio stays exact. White is what PINTR reads as empty, so the
// letterbox and margin simply produce no lines — unless `extend` diffuses the
// picture into them, which makes the drawing reach the frame.
export function frameRgbaImage(
  image: RgbaImage,
  { aspectRatio, padding, extend = false }: FrameOptions
): RgbaImage {
  validateRgbaImage(image);
  if (aspectRatio !== null && (!Number.isFinite(aspectRatio) || aspectRatio <= 0)) {
    throw new PintrError('frame aspectRatio must be a positive number or null');
  }
  if (!Number.isFinite(padding) || padding < 0 || padding >= 50) {
    throw new PintrError('frame padding must be between 0 and 50');
  }

  const longest = Math.max(image.width, image.height);
  const ratio = aspectRatio ?? image.width / image.height;
  const canvasWidth = ratio >= 1 ? longest : Math.max(1, Math.round(longest * ratio));
  const canvasHeight = ratio >= 1 ? Math.max(1, Math.round(longest / ratio)) : longest;

  const pad = Math.round(
    (clamp(padding, 0, 100) / 100) * Math.min(canvasWidth, canvasHeight)
  );
  const innerWidth = Math.max(1, canvasWidth - pad * 2);
  const innerHeight = Math.max(1, canvasHeight - pad * 2);

  // Contain preserves the source ratio, so the scaled longest side is exactly
  // what resizeRgbaImage takes — no second resampler needed here.
  const scale = Math.min(innerWidth / image.width, innerHeight / image.height);
  const scaled =
    scale >= 1
      ? image
      : resizeRgbaImage(image, {
          longestSide: Math.max(1, Math.round(longest * scale)),
        });

  const offsetX = Math.round((canvasWidth - scaled.width) / 2);
  const offsetY = Math.round((canvasHeight - scaled.height) / 2);

  if (extend) {
    return extendRgbaImage(scaled, {
      canvasWidth,
      canvasHeight,
      offsetX,
      offsetY,
    });
  }

  // Walk the canvas rather than the picture: everything the picture does not
  // cover keeps the white the buffer was filled with.
  const rgba = new Uint8ClampedArray(canvasWidth * canvasHeight * 4).fill(255);

  for (let y = 0; y < canvasHeight; y++) {
    const sourceY = y - offsetY;
    if (sourceY < 0 || sourceY >= scaled.height) continue;

    for (let x = 0; x < canvasWidth; x++) {
      const sourceX = x - offsetX;
      if (sourceX < 0 || sourceX >= scaled.width) continue;

      const source = (sourceY * scaled.width + sourceX) * 4;
      const target = (y * canvasWidth + x) * 4;
      rgba[target] = scaled.rgba[source];
      rgba[target + 1] = scaled.rgba[source + 1];
      rgba[target + 2] = scaled.rgba[source + 2];
      rgba[target + 3] = scaled.rgba[source + 3];
    }
  }

  return { width: canvasWidth, height: canvasHeight, rgba };
}
