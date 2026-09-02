import { pinterCreator } from './lib/PINTR';

import { generateSvg } from './lib/svg';
import { coordsFileName, generateCoordsTxt } from './lib/coords-txt';
import { renderCoordsToCanvas } from './lib/renderCoords';
import { preprocessImage } from './lib/preprocess';

import { clamp, debounce, throttle } from './lib/utils';

import type { Coord } from './lib/PINTR';
import type { SourceConfig } from './lib/preprocess';

// The pipeline has three independent layers, and the config mirrors them so the
// "what needs redoing?" question is answered by which group changed rather than
// by a hand-maintained list of field comparisons.

// Only affects the image handed to the algorithm: re-run pre-processing, reload.
export type { SourceConfig };

// Affects the algorithm but not the source image: restart the PINTR session.
// Structurally identical to the core's PintrConfig, so it is passed straight in.
export type GenerationConfig = {
  contrast: number;
  definition: number;
  singleLine: boolean;
  strokeWidth: number;
};

// Independent of both: never regenerates, only repaints (or trims the buffer).
export type RenderConfig = {
  lines: number;
  smoothingAmount: number;
  transparentBackground: boolean;
};

export type configType = {
  source: SourceConfig;
  generation: GenerationConfig;
  render: RenderConfig;
  advancedOptions: boolean;
};

// Stroke width uses the same shape as Lines: the slider is a plain 0-100 track
// and the curve lives here, so the fine widths people actually use occupy most
// of the travel while the thick end stays reachable.
const STROKE_MIN = 0.5;
const STROKE_MAX = 20;
const STROKE_POWER = 2;
// Mirrors the #strokeWidth input's defaultValue; lands on the historical 1.5px.
const STROKE_SLIDER_DEFAULT = 40;

function strokeWidthFromSlider(value: number): number {
  const t = clamp(value, 0, 100) / 100;
  const width =
    STROKE_MIN + (STROKE_MAX - STROKE_MIN) * Math.pow(t, STROKE_POWER);
  return Math.round(width * 100) / 100;
}

const DEFAULT_IMG = '/pintr/test.jpg';

let CONFIG: configType = {
  source: {
    aspectRatio: '',
    padding: 0,
    extend: false,
    vignette: false,
    vignetteDistance: 50,
    vignetteHardness: 50,
    vignetteSquare: false,
  },
  generation: {
    contrast: 50,
    definition: 50,
    singleLine: true,
    strokeWidth: strokeWidthFromSlider(STROKE_SLIDER_DEFAULT),
  },
  render: {
    lines: 50,
    smoothingAmount: 0,
    transparentBackground: true,
  },
  advancedOptions: false,
};

type Size = { width: number; height: number };

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
  // The pre-processed image actually fed to PINTR (equals currentImgSrc when
  // every source option is at its default), plus whether the Source preview
  // shows it. Both sizes are kept so the preview can use the right aspect for
  // whichever of the two it is displaying.
  processedImgSrc: string;
  showPreprocessed: boolean;
  sourceSize: Size;
  processedSize: Size;
} = {
  currentImgSrc: DEFAULT_IMG,
  coords: [],
  buffer: [],
  displayedCount: 0,
  width: 512,
  height: 512,
  drawToken: 0,
  processedImgSrc: DEFAULT_IMG,
  showPreprocessed: false,
  sourceSize: { width: 512, height: 512 },
  processedSize: { width: 512, height: 512 },
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

// Renderers straddle two layers: the stroke geometry comes from the generation
// config, the styling from the render config.
function renderOptions() {
  return { ...CONFIG.generation, ...CONFIG.render };
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
  const t = clamp(CONFIG.render.lines, 0, 100) / 100;
  return Math.round(
    LINES_MIN + (LINES_MAX - LINES_MIN) * Math.pow(t, LINES_POWER)
  );
}

// Repaint the canvas and update the exported coords from the first `count`
// buffered lines, honouring the current smoothing config (these are "settled"
// displayed lines, not a live in-progress draw).
function showFromBuffer(count: number) {
  GLOBAL.coords = GLOBAL.buffer.slice(0, count);
  repaint();
}

// Repaint what is already generated. Nothing here touches PINTR.
function repaint() {
  const ctx = getDrawCtx();
  if (ctx) renderCoordsToCanvas(ctx, GLOBAL.coords, renderOptions());
}

// Fresh drawing: reset the buffer and (re)start PINTR with the current
// generation config, then request the slider-derived line count.
function restartDrawing() {
  if (!PINTR) return;
  GLOBAL.buffer = [];
  GLOBAL.coords = [];
  const desired = desiredLineCount();
  GLOBAL.displayedCount = desired;
  PINTR.start(CONFIG.generation);
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
        ...renderOptions(),
        smoothingAmount: 0,
      });
    PINTR.requestLines(desired);
  }
}

// The coordinate export is in the drawing's own pixel space, which the aspect
// ratio and padding options change. Show the live extent next to the button so
// the numbers in the file are never a guess.
function updateCoordsSize() {
  const coordsSizeEl = document.querySelector('#coordsSize');
  if (coordsSizeEl) {
    coordsSizeEl.textContent = `${GLOBAL.width}\u00d7${GLOBAL.height}`;
  }
}

// Show the source preview, honouring the Source / Pre-processing toggle. Each of
// the two images has its own aspect, which the aspect ratio option can make very
// different from the other's.
function updateSourcePreview() {
  const srcImgEl: HTMLElement | null = document.querySelector('#srcImg');
  if (srcImgEl) {
    const src = GLOBAL.showPreprocessed
      ? GLOBAL.processedImgSrc
      : GLOBAL.currentImgSrc;
    const size = GLOBAL.showPreprocessed
      ? GLOBAL.processedSize
      : GLOBAL.sourceSize;
    srcImgEl.style.backgroundImage = `url("${src}")`;
    srcImgEl.style.aspectRatio = String(size.width / size.height);
  }

  const labelEl: HTMLElement | null = document.querySelector(
    '.srcimage-container .label'
  );
  if (labelEl) {
    labelEl.textContent = GLOBAL.showPreprocessed
      ? 'Source - Pre processing'
      : 'Source';
  }
}

// Create a PINTR instance for a new image and kick off the first drawing. The
// image is run through source pre-processing first; PINTR draws the result.
async function loadImage(imgSrc: string) {
  const myToken = ++GLOBAL.drawToken;
  GLOBAL.currentImgSrc = imgSrc;

  // Stop the previous instance so it doesn't keep drawing to the shared canvas.
  if (PINTR) PINTR.stop();
  PINTR = null;

  const canvasDrawEl: HTMLCanvasElement | null =
    document.querySelector('canvas#draw');
  if (!canvasDrawEl) {
    throw new Error();
  }

  const processed = await preprocessImage(imgSrc, CONFIG.source);
  // A newer image started while this one was pre-processing — discard it.
  if (myToken !== GLOBAL.drawToken) return;
  GLOBAL.processedImgSrc = processed.src;
  GLOBAL.processedSize = { width: processed.width, height: processed.height };

  const instance = await pinterCreator(processed.src, {
    canvasDrawEl,
    onLoad({ width, height }) {
      if (myToken !== GLOBAL.drawToken) return;
      document.documentElement.style.setProperty('--sizew', `${width / 2}px`);
      document.documentElement.style.setProperty('--sizeh', `${height / 2}px`);

      GLOBAL.width = width;
      GLOBAL.height = height;
      updateCoordsSize();
    },
    onProgress({ coords, done }) {
      if (myToken !== GLOBAL.drawToken) return;
      GLOBAL.buffer.push(...coords);
      // Reveal up to the user's current desired count.
      const shown = Math.min(GLOBAL.buffer.length, GLOBAL.displayedCount);
      GLOBAL.coords = GLOBAL.buffer.slice(0, shown);

      // Repaint the completed drawing as one connected path in single-line mode
      // so canvas joins match the SVG (and apply smoothing when requested).
      if (done && CONFIG.generation.singleLine) repaint();
    },
  });

  // A newer image started while this one was loading — discard it.
  if (myToken !== GLOBAL.drawToken) {
    instance.stop();
    return;
  }
  PINTR = instance;

  updateSourcePreview();

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
      selectImage(String(e.target.result));
    });

    FR.readAsDataURL(file);
  }
}

// Adopt a newly chosen image: measure it (the Source preview needs its real
// aspect) and draw it.
function selectImage(imgSrc: string) {
  const probe = new window.Image();
  probe.onload = () => {
    GLOBAL.sourceSize = { width: probe.width, height: probe.height };
    updateSourcePreview();
  };
  probe.src = imgSrc;

  loadImage(imgSrc);
}

function getInputNumber(selector: string): number {
  const inputEl: HTMLInputElement | null = document.querySelector(selector);
  return inputEl ? Number(inputEl.value) : 0;
}

function getInputBoolean(selector: string): boolean {
  const inputEl: HTMLInputElement | null = document.querySelector(selector);
  return inputEl ? Boolean(Number(inputEl.value)) : false;
}

function getInputString(selector: string): string {
  const inputEl: HTMLSelectElement | HTMLInputElement | null =
    document.querySelector(selector);
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
      strokeWidth: strokeWidthFromSlider(getInputNumber('#strokeWidth')),
    },
    render: {
      lines: getInputNumber('#lines'),
      smoothingAmount: getInputNumber('#smoothingAmount'),
      transparentBackground: getInputBoolean('#transparentBackground'),
    },
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

  syncExtendImage();
  updateSmoothingWarning();
}

// Extending only fills margin the frame adds around the picture, so with no
// padding and the original aspect ratio there is nothing for it to do: disable
// the toggle instead of leaving it inert.
function syncExtendImage() {
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

// A control changed. Which layer it belongs to decides how much work to redo:
// source options rebuild the image PINTR draws, generation options restart the
// session, and render options only touch what is already generated.
function onControlChange() {
  const prev = CONFIG;
  CONFIG = readConfigFromInputs();

  syncOptionalSections();

  // Opening Advanced switches the Source preview to the pre-processed image,
  // since that is what the advanced options act on. Clicking the preview still
  // flips it back.
  if (CONFIG.advancedOptions && !prev.advancedOptions) {
    GLOBAL.showPreprocessed = true;
    updateSourcePreview();
  }

  if (changed(CONFIG.source, prev.source)) {
    loadImage(GLOBAL.currentImgSrc);
  } else if (changed(CONFIG.generation, prev.generation)) {
    restartDrawing();
  } else if (CONFIG.render.lines !== prev.render.lines) {
    applyLines();
  } else {
    repaint();
  }
}

// Smoothing only applies to single-line drawings; warn when it won't take effect.
function updateSmoothingWarning() {
  const smoothSvgContainerWarningEl = document.querySelector(
    '.experimental--smooth-svg--container--warning'
  ) as HTMLElement | null;
  if (smoothSvgContainerWarningEl) {
    smoothSvgContainerWarningEl.style.display =
      CONFIG.render.smoothingAmount > 0 && !CONFIG.generation.singleLine
        ? 'block'
        : 'none';
  }
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

    selectImage(String(e.target.result));
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

// React to each control as fast as it's cheap to. Lines only trims or extends
// the already-computed line buffer, so it's effectively free: track the slider
// live (`input`) with a tiny throttle. Smoothing only repaints, so it can track
// live too. Controls that rerun the pixel pass or regenerate the whole drawing
// react only on release (`change`) with a heavier throttle.
const LIVE_CONTROLS = new Set(['lines', 'smoothingAmount']);
const HEAVY_CONTROLS = new Set([
  'contrast',
  'definition',
  'padding',
  'vignetteDistance',
  'vignetteHardness',
]);

/**
 * Wire the drawing UI to the currently mounted page. Next.js keeps this module
 * cached across client-side navigation, so initialization cannot happen as a
 * top-level side effect: Privacy/Support navigation replaces all of these DOM
 * nodes while retaining the module instance.
 */
export function initializePintrApp(): () => void {
  const abortController = new AbortController();
  const { signal } = abortController;
  count = 0;

  const appEl = document.querySelector('.app') as HTMLElement;
  appEl.addEventListener('drop', onDrop, { signal });
  appEl.addEventListener('dragover', onDragOver, { signal });
  appEl.addEventListener('dragenter', onDragEnter, { signal });
  appEl.addEventListener('dragleave', onDragLeave, { signal });

  const inputImageFileEl = document.querySelector(
    '#inputImageFile'
  ) as HTMLInputElement;
  inputImageFileEl.addEventListener('change', readFile, { signal });

  const inputImageButtonEl = document.querySelector(
    '#inputImageButton'
  ) as HTMLElement;
  inputImageButtonEl.addEventListener('click', () => inputImageFileEl.click(), {
    signal,
  });

  document
    .querySelectorAll<HTMLElement>('[data-start-drawing]')
    .forEach((input) => {
      if (LIVE_CONTROLS.has(input.id)) {
        // Throttle (not debounce) so it tracks the slider live during the drag
        // instead of only firing on release.
        input.addEventListener('input', throttle(onControlChange, 16), {
          signal,
        });
      } else {
        const delay = HEAVY_CONTROLS.has(input.id) ? 120 : 32;
        input.addEventListener('change', debounce(onControlChange, delay), {
          signal,
        });
      }
    });

  // Toggles are 0/1 range inputs; let a tap/click anywhere flip them instead of
  // requiring the user to drag the thumb to the other end.
  document
    .querySelectorAll<HTMLInputElement>('input[type="range"].toggle')
    .forEach((toggle) => {
      toggle.addEventListener(
        'pointerdown',
        (evt) => {
          evt.preventDefault();
          toggle.value = Number(toggle.value) ? '0' : '1';
          toggle.dispatchEvent(new Event('change', { bubbles: true }));
        },
        { signal }
      );
    });

  // Click the Source preview to toggle between the original image and the
  // pre-processed image that PINTR actually draws.
  const srcImageContainerEl = document.querySelector(
    '.srcimage-container'
  ) as HTMLElement | null;
  srcImageContainerEl?.addEventListener(
    'click',
    () => {
      GLOBAL.showPreprocessed = !GLOBAL.showPreprocessed;
      updateSourcePreview();
    },
    { signal }
  );

  const downloadEl = document.querySelector('#download') as HTMLButtonElement;
  downloadEl.addEventListener(
    'click',
    () => {
      const link = document.createElement('a');
      const canvasDrawEl = document.querySelector(
        'canvas#draw'
      ) as HTMLCanvasElement;

      link.download = 'PINTR.png';

      if (!CONFIG.render.transparentBackground) {
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
    },
    { signal }
  );

  const downloadSvgEl = document.querySelector(
    '#downloadSvg'
  ) as HTMLButtonElement;
  downloadSvgEl.addEventListener(
    'click',
    () => {
      const link = document.createElement('a');
      link.download = 'PINTR.svg';
      const svgData = generateSvg(GLOBAL.coords, {
        ...renderOptions(),
        size: [GLOBAL.width, GLOBAL.height],
        whiteBackground: !CONFIG.render.transparentBackground,
      });
      const svgBlob = new Blob([svgData], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const svgUrl = URL.createObjectURL(svgBlob);
      link.href = svgUrl;
      link.click();
      setTimeout(() => URL.revokeObjectURL(svgUrl), 1000);
    },
    { signal }
  );

  const downloadTxtEl = document.querySelector(
    '#downloadTxt'
  ) as HTMLButtonElement;
  downloadTxtEl.addEventListener(
    'click',
    () => {
      const link = document.createElement('a');
      link.download = coordsFileName([GLOBAL.width, GLOBAL.height]);
      const txtData = generateCoordsTxt(GLOBAL.coords);
      const txtBlob = new Blob([txtData], { type: 'text/plain;charset=utf-8' });
      const txtUrl = URL.createObjectURL(txtBlob);
      link.href = txtUrl;
      link.click();
      setTimeout(() => URL.revokeObjectURL(txtUrl), 1000);
    },
    { signal }
  );

  // Sync CONFIG/UI from the fresh inputs, then attach the drawing engine to the
  // newly mounted canvas. Keep the selected image across client navigation.
  CONFIG = readConfigFromInputs();
  syncOptionalSections();
  selectImage(GLOBAL.currentImgSrc);

  return () => {
    abortController.abort();
    document.body.classList.remove('-dragging');
    count = 0;

    // Invalidate async image work and stop callbacks from drawing into the
    // detached canvas after navigation.
    GLOBAL.drawToken++;
    PINTR?.stop();
    PINTR = null;
  };
}
