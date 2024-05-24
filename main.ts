import { pinterCreator } from './lib/PINTR';

import { generateSvg } from './lib/svg';
import { generateSmoothSvg } from './lib/smooth-svg';

import { debounce } from './lib/utils';

import type { Coord } from './lib/PINTR';

export type configType = {
  contrast: number;
  definition: number;
  density: number;
  makeSmoothSvg: true | false;
  singleLine: true | false;
  strokeWidth: number;
  smoothingAmount: number;
};

const DEFAULT_IMG = '/test.jpg';

let CONFIG: configType = {
  contrast: 50,
  definition: 50,
  density: 50,
  makeSmoothSvg: false,
  singleLine: true,
  strokeWidth: 1,
  smoothingAmount: 50,
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
      if (!CONFIG.makeSmoothSvg) return;

      console.warn('MAKING');

      const smoothSvgData = generateSmoothSvg(coords, {
        ...CONFIG,
        size: [GLOBAL.width, GLOBAL.height],
      });

      const smoothSvgContainerEl = document.querySelector(
        '.smooth-svg-container'
      ) as HTMLElement;
      smoothSvgContainerEl.innerHTML = smoothSvgData;
    },
  });

  const srcImgEl: HTMLImageElement | null = document.querySelector('#srcImg');
  const loadingEl: HTMLElement | null = document.querySelector('.loading');

  if (srcImgEl && loadingEl) {
    srcImgEl.style.backgroundImage = `url("${imgSrc}")`;
    loadingEl.style.display = 'none';
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

function getInputBoolean(selector: string): true | false {
  const inputEl: HTMLInputElement | null = document.querySelector(selector);
  return inputEl ? Boolean(Number(inputEl.value)) : false;
}

function startNewDrawing() {
  const density = getInputNumber('#density');
  const singleLine = getInputBoolean('#singleLine');
  const contrast = getInputNumber('#contrast');
  const definition = getInputNumber('#definition');
  const strokeWidth = getInputNumber('#strokeWidth');
  const makeSmoothSvg = getInputBoolean('#makeSmoothSvg');
  const smoothingAmount = getInputNumber('#smoothingAmount');

  CONFIG = {
    density,
    singleLine,
    contrast,
    definition,
    strokeWidth,
    makeSmoothSvg,
    smoothingAmount,
  };

  const smoothSvgContainerEl = document.querySelector(
    '.experimental--smoth-svg--container'
  ) as HTMLElement;
  smoothSvgContainerEl.style.display = makeSmoothSvg ? 'block' : 'none';

  const smooghSvgContainerWarningEl = document.querySelector(
    '.experimental--smoth-svg--container--warning'
  ) as HTMLElement;
  smooghSvgContainerWarningEl.style.display = singleLine ? 'none' : 'block';

  main(GLOBAL.currentImgSrc);
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

const smoothingAmountEl = document.querySelector(
  '#smoothingAmount'
) as HTMLInputElement;
smoothingAmountEl.addEventListener(
  'change',
  debounce(() => {
    CONFIG.smoothingAmount = getInputNumber('#smoothingAmount');

    const smoothSvgData = generateSmoothSvg(GLOBAL.coords, {
      ...CONFIG,
      size: [GLOBAL.width, GLOBAL.height],
    });
    const smoothSvgContainerEl = document.querySelector(
      '.smooth-svg-container'
    ) as HTMLElement;
    smoothSvgContainerEl.innerHTML = smoothSvgData;
  }, 128)
);

const downloadEl = document.querySelector('#download') as HTMLButtonElement;
downloadEl.addEventListener('click', () => {
  const link = document.createElement('a');
  const canvasDrawEl = document.querySelector(
    'canvas#draw'
  ) as HTMLCanvasElement;

  link.download = 'PINTR.png';
  link.href = canvasDrawEl.toDataURL();
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
  });
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  link.href = svgUrl;
  link.click();
});

const downloadSmoothSvgEl = document.querySelector(
  '#downloadSmoothSvg'
) as HTMLButtonElement;
downloadSmoothSvgEl.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'PINTR.svg';
  const smoothSvgData = generateSmoothSvg(GLOBAL.coords, {
    ...CONFIG,
    size: [GLOBAL.width, GLOBAL.height],
  });
  const svgBlob = new Blob([smoothSvgData], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const svgUrl = URL.createObjectURL(svgBlob);
  link.href = svgUrl;
  link.click();
});

startNewDrawing();
