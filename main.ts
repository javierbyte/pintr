import { pinterCreator } from './lib/PINTR';

import { generateSvg } from './lib/svg';
import { renderCoordsToCanvas } from './lib/renderCoords';

import { debounce } from './lib/utils';

import type { Coord } from './lib/PINTR';

export type configType = {
  contrast: number;
  definition: number;
  density: number;
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
  density: 50,
  singleLine: true,
  strokeWidth: 1,
  smoothingAmount: 0,
  advancedOptions: false,
  transparentBackground: true,
};

let GLOBAL: {
  currentImgSrc: string;
  coords: [Coord, Coord][];
  width: number;
  height: number;
} = {
  currentImgSrc: DEFAULT_IMG,
  coords: [],
  width: 512,
  height: 512,
};

async function main(imgSrc: string) {
  const canvasDrawEl: HTMLCanvasElement | null =
    document.querySelector('canvas#draw');
  if (!canvasDrawEl) {
    throw new Error();
  }
  const PINTR = await pinterCreator(imgSrc, {
    canvasDrawEl,
    onDraw({ coords }) {
      GLOBAL.coords = coords;
    },
    onLoad({ width, height }) {
      document.documentElement.style.setProperty('--sizew', `${width / 2}px`);
      document.documentElement.style.setProperty('--sizeh', `${height / 2}px`);

      GLOBAL.width = width;
      GLOBAL.height = height;
    },
    onFinish({ coords }) {
      // The animation draws straight lines; once it finishes, redraw the canvas
      // as a smooth curve so the smoothing slider is visible on screen.
      if (!(CONFIG.smoothingAmount > 0 && CONFIG.singleLine)) return;
      const ctx = canvasDrawEl.getContext('2d');
      if (ctx) renderCoordsToCanvas(ctx, coords, CONFIG);
    },
  });

  const srcImgEl: HTMLImageElement | null = document.querySelector('#srcImg');

  if (srcImgEl) {
    srcImgEl.style.backgroundImage = `url("${imgSrc}")`;
  }
  PINTR.render(CONFIG);
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
      main(String(e.target.result));
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

function startNewDrawing() {
  const density = getInputNumber('#density');
  const singleLine = getInputBoolean('#singleLine');
  const contrast = getInputNumber('#contrast');
  const definition = getInputNumber('#definition');
  const strokeWidth = getInputNumber('#strokeWidth');
  const smoothingAmount = getInputNumber('#smoothingAmount');
  const advancedOptions = getInputBoolean('#advancedOptions');
  const transparentBackground = getInputBoolean('#transparentBackground');

  CONFIG = {
    density,
    singleLine,
    contrast,
    definition,
    strokeWidth,
    smoothingAmount,
    advancedOptions,
    transparentBackground,
  };

  const advancedOptionsContainerEl = document.querySelector(
    '.advanced-options--container'
  ) as HTMLElement;
  advancedOptionsContainerEl.style.display = advancedOptions ? 'block' : 'none';

  updateSmoothingWarning();

  main(GLOBAL.currentImgSrc);
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
    main(String(e.target.result));
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

document.querySelectorAll('[data-start-drawing]').forEach((input) => {
  input.addEventListener('change', debounce(startNewDrawing, 32));
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
  debounce(() => {
    CONFIG.smoothingAmount = getInputNumber('#smoothingAmount');
    updateSmoothingWarning();

    // Redraw the existing drawing (smooth or straight) without regenerating lines.
    const canvasDrawEl = document.querySelector(
      'canvas#draw'
    ) as HTMLCanvasElement;
    const ctx = canvasDrawEl.getContext('2d');
    if (ctx) renderCoordsToCanvas(ctx, GLOBAL.coords, CONFIG);
  }, 64)
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

startNewDrawing();
