import { pinterCreator } from './lib/PINTR';

import { generateSvg } from './lib/svg';
import { renderCoordsToCanvas } from './lib/renderCoords';

import { clamp, debounce, throttle } from './lib/utils';

import type { Coord } from './lib/PINTR';

export type configType = {
  contrast: number;
  definition: number;
  lines: number;
  singleLine: boolean;
  strokeWidth: number;
  smoothingAmount: number;
  advancedOptions: boolean;
  transparentBackground: boolean;
};

const DEFAULT_IMG = '/pintr/test.jpg';

let CONFIG: configType = {
  contrast: 50,
  definition: 50,
  lines: 50,
  singleLine: true,
  strokeWidth: 1,
  smoothingAmount: 0,
  advancedOptions: false,
  transparentBackground: true,
};

let GLOBAL: {
  currentImgSrc: string;
  // `buffer` holds every line ever drawn for the current image + generation
  // config (the maximum extent). `coords` is the subset currently shown/exported
  // — lowering the line count just trims `coords` from `buffer` without recomputing.
  coords: [Coord, Coord][];
  buffer: [Coord, Coord][];
  displayedCount: number;
  width: number;
  height: number;
  // Bumped on every new image so a superseded instance's late callbacks are ignored.
  drawToken: number;
} = {
  currentImgSrc: DEFAULT_IMG,
  coords: [],
  buffer: [],
  displayedCount: 0,
  width: 512,
  height: 512,
  drawToken: 0,
};

// The single PINTR instance for the current image. Generation-param changes
// reuse it via start(); only a new image creates a fresh one.
let PINTR: Awaited<ReturnType<typeof pinterCreator>> | null = null;

function getDrawCtx(): CanvasRenderingContext2D | null {
  const canvasDrawEl = document.querySelector(
    'canvas#draw'
  ) as HTMLCanvasElement | null;
  return canvasDrawEl ? canvasDrawEl.getContext('2d') : null;
}

// The Lines slider (0-100) maps directly to a target line count via a power
// curve — no image-lightness or stroke-width scaling, so the slider value alone
// decides how many lines are drawn. Left end is exactly LINES_MIN, right end is
// LINES_MAX, and LINES_POWER bends the curve (1 = linear, higher = slow start /
// steep finish). Tune these three knobs to taste.
const LINES_MIN = 3;
const LINES_MAX = 10000;
const LINES_POWER = 2;

function desiredLineCount(): number {
  if (!PINTR) return 0;
  const t = clamp(CONFIG.lines, 0, 100) / 100;
  return Math.round(
    LINES_MIN + (LINES_MAX - LINES_MIN) * Math.pow(t, LINES_POWER)
  );
}

// Repaint the canvas and update the exported coords from the first `count`
// buffered lines, honouring the current smoothing config (these are "settled"
// displayed lines, not a live in-progress draw).
function showFromBuffer(count: number) {
  GLOBAL.coords = GLOBAL.buffer.slice(0, count);
  const ctx = getDrawCtx();
  if (ctx) renderCoordsToCanvas(ctx, GLOBAL.coords, CONFIG);
}

// Fresh drawing: reset the buffer and (re)start PINTR with the current
// generation config, then request the slider-derived line count.
function restartDrawing() {
  if (!PINTR) return;
  GLOBAL.buffer = [];
  GLOBAL.coords = [];
  const desired = desiredLineCount();
  GLOBAL.displayedCount = desired;
  PINTR.start({
    contrast: CONFIG.contrast,
    definition: CONFIG.definition,
    singleLine: CONFIG.singleLine,
    strokeWidth: CONFIG.strokeWidth,
  });
  PINTR.requestLines(desired);
}

// Lines-only change: never regenerates. If we already have enough lines just
// show the right subset; otherwise repaint the full buffer and ask PINTR to
// continue drawing more on top.
function applyLines() {
  if (!PINTR) return;
  const desired = desiredLineCount();
  GLOBAL.displayedCount = desired;

  if (desired <= GLOBAL.buffer.length) {
    // Enough already drawn — lower/keep the target (halts any in-flight
    // extension) and show the subset.
    PINTR.requestLines(desired);
    showFromBuffer(desired);
  } else {
    // Need more. Repaint the full buffer as straight lines so the strokes PINTR
    // is about to append line up with what's on screen, then request more; the
    // onProgress handler reveals them as they're drawn.
    GLOBAL.coords = GLOBAL.buffer.slice();
    const ctx = getDrawCtx();
    if (ctx)
      renderCoordsToCanvas(ctx, GLOBAL.buffer, {
        ...CONFIG,
        smoothingAmount: 0,
      });
    PINTR.requestLines(desired);
  }
}

// Create a PINTR instance for a new image and kick off the first drawing.
async function loadImage(imgSrc: string) {
  const myToken = ++GLOBAL.drawToken;

  // Stop the previous instance so it doesn't keep drawing to the shared canvas.
  if (PINTR) PINTR.stop();
  PINTR = null;

  const canvasDrawEl: HTMLCanvasElement | null =
    document.querySelector('canvas#draw');
  if (!canvasDrawEl) {
    throw new Error();
  }

  const instance = await pinterCreator(imgSrc, {
    canvasDrawEl,
    onLoad({ width, height }) {
      if (myToken !== GLOBAL.drawToken) return;
      document.documentElement.style.setProperty('--sizew', `${width / 2}px`);
      document.documentElement.style.setProperty('--sizeh', `${height / 2}px`);

      GLOBAL.width = width;
      GLOBAL.height = height;
    },
    onProgress({ coords, done }) {
      if (myToken !== GLOBAL.drawToken) return;
      GLOBAL.buffer.push(...coords);
      // Reveal up to the user's current desired count.
      const shown = Math.min(GLOBAL.buffer.length, GLOBAL.displayedCount);
      GLOBAL.coords = GLOBAL.buffer.slice(0, shown);

      // The live draw is straight lines; once it reaches the target, redraw as a
      // smooth curve so the smoothing slider is visible on screen.
      if (done && CONFIG.smoothingAmount > 0 && CONFIG.singleLine) {
        const ctx = canvasDrawEl.getContext('2d');
        if (ctx) renderCoordsToCanvas(ctx, GLOBAL.coords, CONFIG);
      }
    },
  });

  // A newer image started while this one was loading — discard it.
  if (myToken !== GLOBAL.drawToken) {
    instance.stop();
    return;
  }
  PINTR = instance;

  const srcImgEl: HTMLImageElement | null = document.querySelector('#srcImg');
  if (srcImgEl) {
    srcImgEl.style.backgroundImage = `url("${imgSrc}")`;
  }

  restartDrawing();
}

function readFile(evt: Event) {
  evt.preventDefault();
  evt.stopPropagation();

  const target = evt.target as HTMLInputElement;

  if (!target || !target.files) return;

  const file = target.files[0] as File;

  if (file) {
    const FR = new FileReader();
    FR.addEventListener('load', function (e) {
      if (!e || !e.target) return;
      GLOBAL.currentImgSrc = String(e.target.result);
      loadImage(String(e.target.result));
    });

    FR.readAsDataURL(file);
  }
}

function getInputNumber(selector: string): number {
  const inputEl: HTMLInputElement | null = document.querySelector(selector);
  return inputEl ? Number(inputEl.value) : 0;
}

function getInputBoolean(selector: string): boolean {
  const inputEl: HTMLInputElement | null = document.querySelector(selector);
  return inputEl ? Boolean(Number(inputEl.value)) : false;
}

function readConfigFromInputs(): configType {
  return {
    lines: getInputNumber('#lines'),
    singleLine: getInputBoolean('#singleLine'),
    contrast: getInputNumber('#contrast'),
    definition: getInputNumber('#definition'),
    strokeWidth: getInputNumber('#strokeWidth'),
    smoothingAmount: getInputNumber('#smoothingAmount'),
    advancedOptions: getInputBoolean('#advancedOptions'),
    transparentBackground: getInputBoolean('#transparentBackground'),
  };
}

// A control changed. Generation params (definition/contrast/single line/stroke
// width) restart the drawing; lines is incremental; the rest are UI/export
// only and need no redraw.
function onControlChange() {
  const prev = CONFIG;
  CONFIG = readConfigFromInputs();

  const advancedOptionsContainerEl = document.querySelector(
    '.advanced-options--container'
  ) as HTMLElement;
  advancedOptionsContainerEl.style.display = CONFIG.advancedOptions
    ? 'block'
    : 'none';

  updateSmoothingWarning();

  const generationChanged =
    CONFIG.definition !== prev.definition ||
    CONFIG.contrast !== prev.contrast ||
    CONFIG.singleLine !== prev.singleLine ||
    CONFIG.strokeWidth !== prev.strokeWidth;

  if (generationChanged) {
    restartDrawing();
  } else if (CONFIG.lines !== prev.lines) {
    applyLines();
  }
}

// Smoothing only applies to single-line drawings; warn when it won't take effect.
function updateSmoothingWarning() {
  const smoothingAmount = getInputNumber('#smoothingAmount');
  const singleLine = getInputBoolean('#singleLine');

  const smoothSvgContainerWarningEl = document.querySelector(
    '.experimental--smooth-svg--container--warning'
  ) as HTMLElement;
  smoothSvgContainerWarningEl.style.display =
    smoothingAmount > 0 && !singleLine ? 'block' : 'none';
}

let count = 0;

function onDrop(ev: DragEvent) {
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  if (!ev.dataTransfer || !ev.dataTransfer.files || !ev.dataTransfer.files[0])
    return;

  const FR = new FileReader();
  FR.addEventListener('load', function (e) {
    if (!e || !e.target || !e.target.result) {
      return;
    }

    GLOBAL.currentImgSrc = String(e.target.result);
    loadImage(String(e.target.result));
    document.body.classList.remove('-dragging');
    count = 0;
  });

  FR.readAsDataURL(ev.dataTransfer.files[0]);
}

function onDragOver(evt: DragEvent) {
  evt.preventDefault();
  evt.stopPropagation();
}

function onDragEnter(evt: DragEvent) {
  evt.stopPropagation();
  count++;

  if (count) {
    document.body.classList.add('-dragging');
  } else {
    document.body.classList.remove('-dragging');
  }
}

function onDragLeave(evt: DragEvent) {
  evt.stopPropagation();
  count--;

  if (count) {
    document.body.classList.add('-dragging');
  } else {
    document.body.classList.remove('-dragging');
  }
}

// ADD LISTENERS
const appEl = document.querySelector('.app') as HTMLElement;
appEl.addEventListener('drop', onDrop);
appEl.addEventListener('dragover', onDragOver);
appEl.addEventListener('dragenter', onDragEnter);
appEl.addEventListener('dragleave', onDragLeave);

const inputImageFileEl = document.querySelector(
  '#inputImageFile'
) as HTMLInputElement;

inputImageFileEl.addEventListener('change', readFile);

const inputImageButtonEl = document.querySelector(
  '#inputImageButton'
) as HTMLElement;
inputImageButtonEl.addEventListener('click', () => {
  inputImageFileEl.click();
});

// React to each control as fast as it's cheap to. Lines only trims or extends
// the already-computed line buffer, so it's effectively free: track the slider
// live (`input`) with a tiny throttle. Contrast/definition regenerate the whole
// drawing, so they react only on release (`change`) with a heavier throttle;
// everything else keeps the default.
const HEAVY_CONTROLS = new Set(['contrast', 'definition']);

document
  .querySelectorAll<HTMLInputElement>('[data-start-drawing]')
  .forEach((input) => {
    if (input.id === 'lines') {
      // Throttle (not debounce) so it tracks the slider live during the drag
      // instead of only firing on release.
      input.addEventListener('input', throttle(onControlChange, 16));
    } else {
      const delay = HEAVY_CONTROLS.has(input.id) ? 120 : 32;
      input.addEventListener('change', debounce(onControlChange, delay));
    }
  });

// Toggles are 0/1 range inputs; let a tap/click anywhere flip them instead of
// requiring the user to drag the thumb to the other end.
document
  .querySelectorAll<HTMLInputElement>('input[type="range"].toggle')
  .forEach((toggle) => {
    toggle.addEventListener('pointerdown', (evt) => {
      evt.preventDefault();
      toggle.value = Number(toggle.value) ? '0' : '1';
      toggle.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

const smoothingAmountEl = document.querySelector(
  '#smoothingAmount'
) as HTMLInputElement;
smoothingAmountEl.addEventListener(
  'input',
  throttle(() => {
    CONFIG.smoothingAmount = getInputNumber('#smoothingAmount');
    updateSmoothingWarning();

    // Redraw the existing drawing (smooth or straight) without regenerating lines.
    const canvasDrawEl = document.querySelector(
      'canvas#draw'
    ) as HTMLCanvasElement;
    const ctx = canvasDrawEl.getContext('2d');
    if (ctx) renderCoordsToCanvas(ctx, GLOBAL.coords, CONFIG);
  }, 32)
);

const downloadEl = document.querySelector('#download') as HTMLButtonElement;
downloadEl.addEventListener('click', () => {
  const link = document.createElement('a');
  const canvasDrawEl = document.querySelector(
    'canvas#draw'
  ) as HTMLCanvasElement;

  link.download = 'PINTR.png';

  if (CONFIG.advancedOptions && !CONFIG.transparentBackground) {
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = canvasDrawEl.width;
    tmpCanvas.height = canvasDrawEl.height;
    const tmpCtx = tmpCanvas.getContext('2d') as CanvasRenderingContext2D;
    tmpCtx.fillStyle = '#fff';
    tmpCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
    tmpCtx.drawImage(canvasDrawEl, 0, 0);
    link.href = tmpCanvas.toDataURL();
  } else {
    link.href = canvasDrawEl.toDataURL();
  }

  link.click();
});

const downloadSvgEl = document.querySelector(
  '#downloadSvg'
) as HTMLButtonElement;
downloadSvgEl.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'PINTR.svg';
  const svgData = generateSvg(GLOBAL.coords, {
    ...CONFIG,
    size: [GLOBAL.width, GLOBAL.height],
    whiteBackground: CONFIG.advancedOptions && !CONFIG.transparentBackground,
  });
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  link.href = svgUrl;
  link.click();
  setTimeout(() => URL.revokeObjectURL(svgUrl), 1000);
});

// Initial bootstrap: sync CONFIG/UI from the inputs' default values, then load
// the default image and start drawing.
CONFIG = readConfigFromInputs();
(
  document.querySelector('.advanced-options--container') as HTMLElement
).style.display = CONFIG.advancedOptions ? 'block' : 'none';
updateSmoothingWarning();
loadImage(GLOBAL.currentImgSrc);
