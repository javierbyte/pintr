import { imageToRawData } from 'canvas-image-utils';

import { applyVignette, frameRgbaImage } from './pintr-core/utils';

import type { RgbaImage } from './pintr-core/utils';

// Every drawing is made at this size (longest side), so padding and stroke
// width mean the same thing whatever the resolution of the picture.
const DRAW_SIZE = 1080;

export type SourceConfig = {
  // '' keeps the source ratio; otherwise 'W:H'.
  aspectRatio: string;
  // 0-100, percent of the canvas short side.
  padding: number;
  extend: boolean;
  vignette: boolean;
  vignetteDistance: number;
  vignetteHardness: number;
  vignetteSquare: boolean;
};

export async function loadSourceImage(imgSrc: string): Promise<RgbaImage> {
  const { width, height, data } = await imageToRawData(imgSrc, {
    size: DRAW_SIZE,
    canvas: document.createElement('canvas'),
    crop: false,
  });

  return { width, height, rgba: data };
}

// 'W:H' -> W / H. Anything unparseable keeps the source ratio.
function parseAspectRatio(value: string): number | null {
  const [w, h] = value.split(':').map(Number);
  return w > 0 && h > 0 ? w / h : null;
}

// The image PINTR actually draws. With every option at its default it is the
// same picture, pixel by pixel.
//
// The vignette goes on top of whatever counts as the picture: extending makes
// that the whole canvas, so it runs last. Without extend the frame is only
// white margin, so it runs on the picture first.
export function processSourceImage(
  image: RgbaImage,
  config: SourceConfig
): RgbaImage {
  const vignette = (input: RgbaImage) =>
    config.vignette ? applyVignette(input, config) : input;
  const frame = (input: RgbaImage) =>
    frameRgbaImage(input, {
      aspectRatio: parseAspectRatio(config.aspectRatio),
      padding: config.padding,
      extend: config.extend,
    });

  return config.extend ? vignette(frame(image)) : frame(vignette(image));
}
