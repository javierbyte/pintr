import { clamp, validateRgbaImage } from './shared';
import type { RgbaImage } from './types';

export type VignetteOptions = {
  vignetteDistance: number;
  vignetteHardness: number;
  vignetteSquare: boolean;
};

export function applyVignette(
  image: RgbaImage,
  { vignetteDistance, vignetteHardness, vignetteSquare }: VignetteOptions
): RgbaImage {
  validateRgbaImage(image);
  const { width: W, height: H } = image;
  const rgba = new Uint8ClampedArray(image.rgba);
  const SHORT_SIDE = Math.min(W, H);
  const cx = W / 2;
  const cy = H / 2;

  // distance in px; 0 = strongest (fade at the inscribed edge), raising it pushes
  // the fade outward toward the corners until it disappears.
  const VD = (clamp(vignetteDistance, 0, 100) / 100) * (SHORT_SIDE / 2);
  const hardness = clamp(vignetteHardness, 0, 100) / 100;
  const outer = VD + SHORT_SIDE / 2;
  const inner = outer - (1 - hardness) * SHORT_SIDE;
  const denom = Math.max(1e-6, outer - inner);
  const hx = vignetteSquare ? SHORT_SIDE / 2 : W / 2;
  const hy = vignetteSquare ? SHORT_SIDE / 2 : H / 2;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d =
        (SHORT_SIDE / 2) * Math.hypot((x - cx) / hx, (y - cy) / hy);

      let alpha: number;
      if (d <= inner) alpha = 1;
      else if (d >= outer) alpha = 0;
      else alpha = (outer - d) / denom;

      if (alpha >= 1) continue;

      const i = (y * W + x) * 4;
      const white = (1 - alpha) * 255;
      rgba[i] = rgba[i] * alpha + white;
      rgba[i + 1] = rgba[i + 1] * alpha + white;
      rgba[i + 2] = rgba[i + 2] * alpha + white;
    }
  }

  return { width: W, height: H, rgba };
}
