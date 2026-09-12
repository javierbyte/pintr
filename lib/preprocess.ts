import { applyVignette, frameRgbaImage } from './pintr-core/utils';
import type { RgbaImage } from './pintr-core/utils';

// Cap the working canvas at the size PINTR itself draws at, so the per-pixel
// pass stays fast, the resulting data URL small, and padding percentages mean
// the same thing whatever the source resolution.
const MAX_SIDE = 1080;

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

export type PreprocessedImage = {
  src: string;
  width: number;
  height: number;
};

// Decoding an image is the slow part, so keep the last decoded source canvas
// around — dragging a pre-processing slider re-runs the pixel pass but not the decode.
let cache: { src: string; canvas: HTMLCanvasElement } | null = null;

function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function getSourceCanvas(imgSrc: string): Promise<HTMLCanvasElement> {
  if (cache && cache.src === imgSrc) return cache.canvas;

  const img = await loadImageEl(imgSrc);
  const ratio = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * ratio));
  const h = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Failed to 'getContext2d'");
  ctx.drawImage(img, 0, 0, w, h);

  cache = { src: imgSrc, canvas };
  return canvas;
}

// 'W:H' -> W / H. Anything unparseable keeps the source ratio.
function parseAspectRatio(value: string): number | null {
  const [w, h] = value.split(':').map(Number);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return w / h;
}

function isIdentity(config: SourceConfig): boolean {
  return (
    !config.vignette &&
    parseAspectRatio(config.aspectRatio) === null &&
    config.padding === 0
  );
}

// Apply the source options in the order the picture demands. The vignette always
// belongs on top of whatever counts as the picture: extending makes that the
// whole framed canvas, so it runs last; without extend the frame is only white
// margin, which the vignette must neither be centred on nor scaled against, so
// it runs on the picture first.
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

// Produce the image actually fed to PINTR. With every source option at its
// default this is a passthrough so the rest of the pipeline is byte-for-byte
// unchanged.
export async function preprocessImage(
  imgSrc: string,
  config: SourceConfig
): Promise<PreprocessedImage> {
  const srcCanvas = await getSourceCanvas(imgSrc);

  if (isIdentity(config)) {
    return { src: imgSrc, width: srcCanvas.width, height: srcCanvas.height };
  }

  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) throw new Error("Failed to 'getContext2d'");
  const source = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);

  const image = processSourceImage(
    { width: source.width, height: source.height, rgba: source.data },
    config
  );

  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Failed to 'getContext2d'");
  ctx.putImageData(
    new ImageData(
      new Uint8ClampedArray(image.rgba),
      image.width,
      image.height
    ),
    0,
    0
  );

  return { src: canvas.toDataURL(), width: image.width, height: image.height };
}
