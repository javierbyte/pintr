import { pinterCreator } from './lib/PINTR';

import { generateSvg } from './lib/svg';
import { generateCoordsTxt } from './lib/coords-txt';
import { loadSourceImage, processSourceImage } from './lib/preprocess';

import { clamp, debounce, throttle } from './lib/utils';

import type { PintrConfig } from './lib/PINTR';
import type { SourceConfig } from './lib/preprocess';
import type { RgbaImage } from './lib/pintr-core/utils';

// What a change needs to redo depends on where it lives: `source` changes the
// image PINTR draws, `generation` changes which lines get picked, and the rest
// only changes how much of the drawing is shown or how it is exported.
type configType = {
  source: SourceConfig;
  generation: PintrConfig;
  lines: number;
  transparentBackground: boolean;
  advancedOptions: boolean;
};

const DEFAULT_IMG = '/pintr/test.jpg';

// Read from the inputs, their default values live in the page.
let CONFIG: configType;

let GLOBAL: {
  currentImgSrc: string;
  // the picture as it was loaded, and what PINTR draws after the source options
  source: RgbaImage | null;
  processed: RgbaImage | null;
  showPreprocessed: boolean;
} = {
  currentImgSrc: DEFAULT_IMG,
  source: null,
  processed: null,
  showPreprocessed: false,
};

let PINTR: ReturnType<typeof pinterCreator> | null = null;

async function selectImage(imgSrc: string) {
  GLOBAL.currentImgSrc = imgSrc;
  const source = await loadSourceImage(imgSrc);

  // another image was selected while this one was loading
  if (imgSrc !== GLOBAL.currentImgSrc) return;

  GLOBAL.source = source;
  startNewDrawing();
}

function startNewDrawing() {
  const canvasDrawEl: HTMLCanvasElement | null =
    document.querySelector('canvas#draw');
  if (!canvasDrawEl || !GLOBAL.source) return;

  if (PINTR) PINTR.stop();

  GLOBAL.processed = processSourceImage(GLOBAL.source, CONFIG.source);
  const { width, height } = GLOBAL.processed;

  document.documentElement.style.setProperty('--sizew', `${width / 2}px`);

  // the TXT export is in this same pixel space, show it next to the button
  const coordsSizeEl = document.querySelector('#coordsSize');
  if (coordsSizeEl) coordsSizeEl.textContent = `${width}×${height}`;

  updateSourcePreview();

  PINTR = pinterCreator(GLOBAL.processed, canvasDrawEl);
  PINTR.render(CONFIG.generation, CONFIG.lines);
}

// The preview shows the picture, or what PINTR draws after the source options.
function updateSourcePreview() {
  const image = GLOBAL.showPreprocessed ? GLOBAL.processed : GLOBAL.source;
  const srcImgEl: HTMLCanvasElement | null =
    document.querySelector('canvas#srcImg');
  const labelEl = document.querySelector('.srcimage-container .label');
  if (!image || !srcImgEl || !labelEl) return;

  srcImgEl.width = image.width;
  srcImgEl.height = image.height;
  const srcCtx = srcImgEl.getContext('2d') as CanvasRenderingContext2D;
  srcCtx.putImageData(
    new ImageData(
      new Uint8ClampedArray(image.rgba),
      image.width,
      image.height
    ),
    0,
    0
  );

  labelEl.textContent = GLOBAL.showPreprocessed
    ? 'Source - Pre processing'
    : 'Source';
}

function readFile(file: File | undefined) {
  if (!file) return;

  const FR = new FileReader();
  FR.addEventListener('load', function () {
    if (FR.result) selectImage(String(FR.result));
  });

  FR.readAsDataURL(file);
}

// Sliders are plain 0-100 tracks. The curve gives most of the travel to the low
// values people actually use, while keeping the high end reachable.
function sliderCurve(value: number, min: number, max: number): number {
  const t = clamp(value, 0, 100) / 100;
  return min + (max - min) * Math.pow(t, 2);
}

function getInputNumber(selector: string): number {
  const inputEl: HTMLInputElement | null = document.querySelector(selector);
  return inputEl ? Number(inputEl.value) : 0;
}

function getInputBoolean(selector: string): boolean {
  return Boolean(getInputNumber(selector));
}

function getInputString(selector: string): string {
  const inputEl: HTMLSelectElement | null = document.querySelector(selector);
  return inputEl ? inputEl.value : '';
}

function readConfigFromInputs(): configType {
  return {
    source: {
      aspectRatio: getInputString('#aspectRatio'),
      padding: getInputNumber('#padding'),
      extend: getInputBoolean('#extendImage'),
      vignette: getInputBoolean('#vignette'),
      vignetteDistance: getInputNumber('#vignetteDistance'),
      vignetteHardness: getInputNumber('#vignetteHardness'),
      vignetteSquare: getInputBoolean('#vignetteSquare'),
    },
    generation: {
      contrast: getInputNumber('#contrast'),
      definition: getInputNumber('#definition'),
      singleLine: getInputBoolean('#singleLine'),
      // in px, from 0.5 to 20. It also changes which lines get picked, since
      // thicker lines cover more of the image.
      strokeWidth:
        Math.round(sliderCurve(getInputNumber('#strokeWidth'), 0.5, 20) * 100) /
        100,
    },
    // from 3 to 10000 lines
    lines: Math.round(sliderCurve(getInputNumber('#lines'), 3, 10000)),
    transparentBackground: getInputBoolean('#transparentBackground'),
    advancedOptions: getInputBoolean('#advancedOptions'),
  };
}

function changed<T extends object>(a: T, b: T): boolean {
  return (Object.keys(a) as (keyof T)[]).some((key) => a[key] !== b[key]);
}

// Shows or hides an optional panel. A panel that is half of a folder also marks
// its wrapper, so the panel and its toggle row draw as one open folder.
function syncOptionalPanel(panelSelector: string, open: boolean) {
  const panelEl = document.querySelector(panelSelector) as HTMLElement | null;
  if (!panelEl) return;

  panelEl.style.display = open ? 'block' : 'none';
  panelEl.closest('.folder')?.classList.toggle('-open', open);
}

function syncOptionalSections() {
  syncOptionalPanel('.advanced-options--container', CONFIG.advancedOptions);
  syncOptionalPanel('.vignette-options--container', CONFIG.source.vignette);

  // Extending only fills the margin that padding or a new aspect ratio add
  // around the picture, without them there is nothing for it to do.
  const extendImageEl = document.querySelector(
    '#extendImage'
  ) as HTMLInputElement | null;
  if (!extendImageEl) return;

  const framed = CONFIG.source.padding > 0 || CONFIG.source.aspectRatio !== '';
  extendImageEl.disabled = !framed;
  extendImageEl
    .closest('.input-container')
    ?.classList.toggle('-disabled', !framed);
}

function onControlChange() {
  const prev = CONFIG;
  CONFIG = readConfigFromInputs();

  syncOptionalSections();

  // The advanced options act on the pre-processed image, so show that one when
  // they open. Clicking the preview still flips it back.
  if (CONFIG.advancedOptions && !prev.advancedOptions) {
    GLOBAL.showPreprocessed = true;
    updateSourcePreview();
  }

  if (changed(CONFIG.source, prev.source)) {
    startNewDrawing();
  } else if (changed(CONFIG.generation, prev.generation)) {
    PINTR?.render(CONFIG.generation, CONFIG.lines);
  } else if (CONFIG.lines !== prev.lines) {
    PINTR?.setLineCount(CONFIG.lines);
  }
}

// dragenter and dragleave also fire for every child element the pointer crosses
let dragCount = 0;

function setDragging(count: number) {
  dragCount = count;
  document.body.classList.toggle('-dragging', dragCount > 0);
}

function download(fileName: string, href: string) {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = href;
  link.click();
}

function downloadText(fileName: string, data: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  download(fileName, url);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadPng() {
  const canvasDrawEl = document.querySelector(
    'canvas#draw'
  ) as HTMLCanvasElement;

  if (CONFIG.transparentBackground) {
    download('PINTR.png', canvasDrawEl.toDataURL());
    return;
  }

  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = canvasDrawEl.width;
  tmpCanvas.height = canvasDrawEl.height;
  const tmpCtx = tmpCanvas.getContext('2d') as CanvasRenderingContext2D;
  tmpCtx.fillStyle = '#fff';
  tmpCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
  tmpCtx.drawImage(canvasDrawEl, 0, 0);
  download('PINTR.png', tmpCanvas.toDataURL());
}

function downloadSvg() {
  if (!PINTR || !GLOBAL.processed) return;

  const svgData = generateSvg(PINTR.getCoords(), {
    ...CONFIG.generation,
    size: [GLOBAL.processed.width, GLOBAL.processed.height],
    whiteBackground: !CONFIG.transparentBackground,
  });
  downloadText('PINTR.svg', svgData, 'image/svg+xml;charset=utf-8');
}

function downloadTxt() {
  if (!PINTR || !GLOBAL.processed) return;

  // the coordinates mean nothing without the size they are measured against
  const { width, height } = GLOBAL.processed;
  downloadText(
    `PINTR-${width}x${height}.txt`,
    generateCoordsTxt(PINTR.getCoords()),
    'text/plain;charset=utf-8'
  );
}

// Next.js keeps this module alive across client-side navigation while the page
// DOM comes and goes, so the listeners are added on every mount (and removed by
// the returned function) instead of once at the top level.
export function initializePintrApp(): () => void {
  const abortController = new AbortController();
  const { signal } = abortController;

  function on(selector: string, type: string, listener: (evt: any) => void) {
    document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener(type, listener, { signal });
    });
  }

  on('.app', 'dragover', (evt: DragEvent) => evt.preventDefault());
  on('.app', 'dragenter', () => setDragging(dragCount + 1));
  on('.app', 'dragleave', () => setDragging(dragCount - 1));
  on('.app', 'drop', (evt: DragEvent) => {
    // Prevent default behavior (Prevent file from being opened)
    evt.preventDefault();
    setDragging(0);
    readFile(evt.dataTransfer?.files[0]);
  });

  const inputImageFileEl = document.querySelector(
    '#inputImageFile'
  ) as HTMLInputElement;
  on('#inputImageFile', 'change', () => readFile(inputImageFileEl.files?.[0]));
  on('#inputImageButton', 'click', () => inputImageFileEl.click());

  // Lines only shows more or less of the same drawing, so it follows the slider
  // live. Everything else makes a new drawing, so it waits for the release, and
  // a bit longer for the sliders that are easy to nudge many times in a row.
  on('#lines', 'input', throttle(onControlChange, 16));
  on(
    '[data-start-drawing]:not(#lines, .toggle, select)',
    'change',
    debounce(onControlChange, 120)
  );
  on(
    '[data-start-drawing]:is(.toggle, select)',
    'change',
    debounce(onControlChange, 32)
  );

  // Toggles are 0/1 range inputs; let a tap/click anywhere flip them instead of
  // requiring the user to drag the thumb to the other end.
  on('input.toggle', 'pointerdown', (evt: PointerEvent) => {
    const toggleEl = evt.currentTarget as HTMLInputElement;
    evt.preventDefault();
    toggleEl.value = Number(toggleEl.value) ? '0' : '1';
    toggleEl.dispatchEvent(new Event('change', { bubbles: true }));
  });

  on('.srcimage-container', 'click', () => {
    GLOBAL.showPreprocessed = !GLOBAL.showPreprocessed;
    updateSourcePreview();
  });

  on('#download', 'click', downloadPng);
  on('#downloadSvg', 'click', downloadSvg);
  on('#downloadTxt', 'click', downloadTxt);

  CONFIG = readConfigFromInputs();
  syncOptionalSections();
  selectImage(GLOBAL.currentImgSrc);

  return () => {
    abortController.abort();
    setDragging(0);

    if (PINTR) PINTR.stop();
    PINTR = null;
  };
}
