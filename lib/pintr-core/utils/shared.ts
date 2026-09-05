import type { RgbaImage } from './types';
import { PintrError } from '../types';

const MAX_PIXELS = 100_000_000;

export function validateRgbaImage(image: RgbaImage) {
  if (!Number.isInteger(image.width) || !Number.isInteger(image.height)) {
    throw new PintrError('RGBA image dimensions must be integers');
  }
  if (image.width <= 0 || image.height <= 0) {
    throw new PintrError('RGBA image dimensions must be positive');
  }
  if (image.width * image.height > MAX_PIXELS) {
    throw new PintrError('RGBA image is too large');
  }
  if (
    !(image.rgba instanceof Uint8Array) &&
    !(image.rgba instanceof Uint8ClampedArray)
  ) {
    throw new PintrError('RGBA pixels must be a Uint8Array');
  }
  if (image.rgba.length !== image.width * image.height * 4) {
    throw new PintrError('RGBA image has the wrong byte length');
  }
}

export function clamp(value: number, start: number, end: number) {
  const min = Math.min(start, end);
  const max = Math.max(start, end);
  return Math.min(Math.max(value, min), max);
}

// ImageData writes use ToUint8Clamp rather than Uint8Array's modulo behavior.
// Keeping it explicit makes browser and CLI byte buffers prepare identically.
export function toUint8Clamp(value: number) {
  if (Number.isNaN(value) || value <= 0) return 0;
  if (value >= 255) return 255;

  const floor = Math.floor(value);
  const fraction = value - floor;
  if (fraction > 0.5) return floor + 1;
  if (fraction < 0.5) return floor;
  return floor % 2 ? floor + 1 : floor;
}
