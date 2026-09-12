import type { PintrImage } from '../types';
import { toUint8Clamp, validateRgbaImage } from './shared';
import type { RgbaImage } from './types';

const RED_PREFERENCE = 0.1;
const WEIGHTS = {
  r: 0.299 + RED_PREFERENCE,
  g: 0.587 + RED_PREFERENCE * -0.5,
  b: 0.114 + RED_PREFERENCE * -0.5,
};

export function preparePintrImage(image: RgbaImage): PintrImage {
  validateRgbaImage(image);
  const pixels = image.rgba;
  let minLightness = Infinity;
  let maxLightness = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    let lightness =
      pixels[i] * WEIGHTS.r +
      pixels[i + 1] * WEIGHTS.g +
      pixels[i + 2] * WEIGHTS.b;

    // Keep the current split behavior: transparent pixels affect the min/max as
    // white here, while the RGB normalization below still uses their RGB bytes.
    if (pixels[i + 3] < 128) lightness = 255;

    minLightness = Math.min(minLightness, lightness);
    maxLightness = Math.max(maxLightness, lightness);
  }

  minLightness += 32;
  maxLightness -= 32;
  const contrast = 255 / (maxLightness - minLightness);
  const gray = new Uint8Array(image.width * image.height);

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const rgbaIndex = (y * image.width + x) * 4;
      const lightness =
        pixels[rgbaIndex] * WEIGHTS.r +
        pixels[rgbaIndex + 1] * WEIGHTS.g +
        pixels[rgbaIndex + 2] * WEIGHTS.b;
      const normalized = toUint8Clamp(
        Math.round(lightness * contrast) - minLightness
      );
      const alpha = pixels[rgbaIndex + 3];
      const composited =
        alpha === 255
          ? normalized
          : Math.round(
              normalized * (alpha / 255) + 255 * (1 - alpha / 255)
            );

      gray[x * image.height + y] = composited;
    }
  }

  return { width: image.width, height: image.height, gray };
}
