import { PintrError } from '../types';
import { clamp, toUint8Clamp, validateRgbaImage } from './shared';
import type { RgbaImage } from './types';

export type ExtendOptions = {
  // The canvas the picture is being placed on, and where it sits inside it.
  canvasWidth: number;
  canvasHeight: number;
  offsetX: number;
  offsetY: number;
};

// How many nested boxes the weighted average blends, each half the radius of the
// one before. Four octaves put roughly eighty times more weight on a pixel
// against the picture than on one at the far edge of the window, while still
// giving every scale a comparable share of the total — so the fill keeps the
// structure it is nearest to and stays self-similar as the radius grows.
const LEVELS = 4;

// Fill everything around a picture with a plausible continuation of it.
//
// For a pixel outside the picture, the nearest picture pixel is just a clamp of
// its coordinates — the picture is always an axis-aligned rectangle, so no
// distance transform is needed. The colour written is then an average of the
// picture pixels within that same distance of the nearest pixel, weighted so the
// ones closest to it count for most: touching the edge it is the edge pixel
// itself, and the further out it travels the wider it averages, until the far
// corners settle on the picture's overall tone. It reads as the picture
// diffusing outward rather than the edge pixel smearing.
//
// The weighting is what nested boxes buy. A single box would let a pixel at the
// rim of the window pull as hard as one against the picture, which flattens the
// structure the fill is supposed to continue; averaging boxes of shrinking
// radius counts the near ones repeatedly, so weight falls off with distance.
// Boxes rather than discs are what make it affordable: a summed-area table
// answers any box in four lookups, so the pass stays linear in the canvas
// however large the radii grow.
export function extendRgbaImage(
  picture: RgbaImage,
  { canvasWidth, canvasHeight, offsetX, offsetY }: ExtendOptions
): RgbaImage {
  validateRgbaImage(picture);
  if (!Number.isInteger(canvasWidth) || !Number.isInteger(canvasHeight)) {
    throw new PintrError('extend canvas dimensions must be integers');
  }
  if (canvasWidth <= 0 || canvasHeight <= 0) {
    throw new PintrError('extend canvas dimensions must be positive');
  }
  if (!Number.isInteger(offsetX) || !Number.isInteger(offsetY)) {
    throw new PintrError('extend offsets must be integers');
  }

  const { width, height } = picture;
  const source = picture.rgba;

  // A row and a column of zeros ahead of the picture so the four-corner lookup
  // needs no bounds tests. Every entry sums at most 100M bytes, well inside
  // Uint32, so the sums stay exact and the fill stays deterministic.
  const satWidth = width + 1;
  const sat = new Uint32Array(satWidth * (height + 1) * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = (y * width + x) * 4;
      const current = ((y + 1) * satWidth + x + 1) * 4;
      const above = (y * satWidth + x + 1) * 4;
      const before = ((y + 1) * satWidth + x) * 4;
      const diagonal = (y * satWidth + x) * 4;

      for (let channel = 0; channel < 4; channel++) {
        sat[current + channel] =
          source[pixel + channel] +
          sat[above + channel] +
          sat[before + channel] -
          sat[diagonal + channel];
      }
    }
  }

  const spare = new Float64Array(4);

  // Mean of the box of the given whole radius around a picture pixel, clipped to
  // the picture — outside it there is nothing to average.
  function boxMean(
    centreX: number,
    centreY: number,
    radius: number,
    target: Float64Array
  ) {
    const x0 = Math.max(0, centreX - radius);
    const y0 = Math.max(0, centreY - radius);
    const x1 = Math.min(width - 1, centreX + radius);
    const y1 = Math.min(height - 1, centreY + radius);
    const count = (x1 - x0 + 1) * (y1 - y0 + 1);

    const topLeft = (y0 * satWidth + x0) * 4;
    const topRight = (y0 * satWidth + x1 + 1) * 4;
    const bottomLeft = ((y1 + 1) * satWidth + x0) * 4;
    const bottomRight = ((y1 + 1) * satWidth + x1 + 1) * 4;

    for (let channel = 0; channel < 4; channel++) {
      target[channel] =
        (sat[bottomRight + channel] -
          sat[topRight + channel] -
          sat[bottomLeft + channel] +
          sat[topLeft + channel]) /
        count;
    }
  }

  // The same for a fractional radius. Blending the two whole radii keeps every
  // box continuous with the distance that chose it; rounding instead makes the
  // contours of that rounding — rounded rectangles around the picture — visible
  // as bands wherever the picture is smooth.
  function boxMeanAt(
    centreX: number,
    centreY: number,
    radius: number,
    target: Float64Array
  ) {
    const whole = Math.floor(radius);
    const fraction = radius - whole;

    boxMean(centreX, centreY, whole, target);
    if (fraction > 0) {
      boxMean(centreX, centreY, whole + 1, spare);
      for (let channel = 0; channel < 4; channel++) {
        target[channel] += (spare[channel] - target[channel]) * fraction;
      }
    }
  }

  const rgba = new Uint8ClampedArray(canvasWidth * canvasHeight * 4);
  const level = new Float64Array(4);
  const weighted = new Float64Array(4);

  for (let y = 0; y < canvasHeight; y++) {
    const sourceY = y - offsetY;
    const sampleY = clamp(sourceY, 0, height - 1);
    const dy = sourceY - sampleY;

    for (let x = 0; x < canvasWidth; x++) {
      const sourceX = x - offsetX;
      const sampleX = clamp(sourceX, 0, width - 1);
      const dx = sourceX - sampleX;
      const target = (y * canvasWidth + x) * 4;

      // The clamp moved nothing, so this pixel is the picture: copy it verbatim
      // rather than averaging over it.
      if (dx === 0 && dy === 0) {
        const pixel = (sampleY * width + sampleX) * 4;
        rgba[target] = source[pixel];
        rgba[target + 1] = source[pixel + 1];
        rgba[target + 2] = source[pixel + 2];
        rgba[target + 3] = source[pixel + 3];
        continue;
      }

      weighted[0] = 0;
      weighted[1] = 0;
      weighted[2] = 0;
      weighted[3] = 0;

      let radius = Math.sqrt(dx * dx + dy * dy);
      for (let step = 0; step < LEVELS; step++) {
        boxMeanAt(sampleX, sampleY, radius, level);
        weighted[0] += level[0];
        weighted[1] += level[1];
        weighted[2] += level[2];
        weighted[3] += level[3];
        radius /= 2;
      }

      rgba[target] = toUint8Clamp(weighted[0] / LEVELS);
      rgba[target + 1] = toUint8Clamp(weighted[1] / LEVELS);
      rgba[target + 2] = toUint8Clamp(weighted[2] / LEVELS);
      rgba[target + 3] = toUint8Clamp(weighted[3] / LEVELS);
    }
  }

  return { width: canvasWidth, height: canvasHeight, rgba };
}
