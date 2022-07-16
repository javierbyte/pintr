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

const DEFAULT_IMG = './test.jpg';

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
  const PINTR = await pinterCreator(imgSrc, {
    canvasDrawEl: document.querySelector('canvas#draw'),
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

      const smoothSvgData = generateSmoothSvg(coords, {
        ...CONFIG,
        size: [GLOBAL.width, GLOBAL.height],
      });
      document.querySelector('.smooth-svg-container').innerHTML = smoothSvgData;
    },
  });

  const srcImgEl: HTMLImageElement = document.querySelector('#srcImg');
  const loadingEl: HTMLElement = document.querySelector('.loading');

  srcImgEl.style.backgroundImage = `url("${imgSrc}")`;
  loadingEl.style.display = 'none';
  PINTR.render(CONFIG);
}

function readFile(evt: Event) {
  evt.preventDefault();
  evt.stopPropagation();

  if (this.files && this.files[0]) {
    const FR = new FileReader();
    FR.addEventListener('load', function (e) {
      GLOBAL.currentImgSrc = String(e.target.result);
      main(String(e.target.result));
    });

    FR.readAsDataURL(this.files[0]);
  }
}

function getInputNumber(selector): number {
  const inputEl: HTMLInputElement = document.querySelector(selector);
  return Number(inputEl.value);
}

function getInputBoolean(selector): true | false {
  const inputEl: HTMLInputElement = document.querySelector(selector);
  return Boolean(Number(inputEl.value));
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

  const smoothSvgContainerEl: HTMLElement = document.querySelector(
    '.experimental--smoth-svg--container'
  );
  smoothSvgContainerEl.style.display = makeSmoothSvg ? 'block' : 'none';

  const smooghSvgContainerWarningEl: HTMLElement = document.querySelector(
    '.experimental--smoth-svg--container--warning'
  );
  smooghSvgContainerWarningEl.style.display = singleLine ? 'none' : 'block';

  main(GLOBAL.currentImgSrc);
}

let count = 0;

function onDrop(ev: DragEvent) {
  console.log('File(s) dropped');

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  if (!ev.dataTransfer.files || !ev.dataTransfer.files[0]) return;

  const FR = new FileReader();
  FR.addEventListener('load', function (e) {
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
  console.log(count);

  if (count) {
    document.body.classList.add('-dragging');
  } else {
    document.body.classList.remove('-dragging');
  }
}

function onDragLeave(evt: DragEvent) {
  evt.stopPropagation();
  count--;
  console.log(count);

  if (count) {
    document.body.classList.add('-dragging');
  } else {
    document.body.classList.remove('-dragging');
  }
}

// ADD LISTENERS
const appEl = document.querySelector('.app');
appEl.addEventListener('drop', onDrop);
appEl.addEventListener('dragover', onDragOver);
appEl.addEventListener('dragenter', onDragEnter);
appEl.addEventListener('dragleave', onDragLeave);

const inputImageFileEl: HTMLInputElement =
  document.querySelector('#inputImageFile');

inputImageFileEl.addEventListener('change', readFile);
document.querySelector('#inputImageButton').addEventListener('click', () => {
  inputImageFileEl.click();
});

document.querySelectorAll('[data-start-drawing]').forEach((input) => {
  input.addEventListener('change', debounce(startNewDrawing, 256));
});

document.querySelector('#smoothingAmount').addEventListener(
  'change',
  debounce(() => {
    const smoothSvgData = generateSmoothSvg(GLOBAL.coords, {
      ...CONFIG,
      size: [GLOBAL.width, GLOBAL.height],
    });
    document.querySelector('.smooth-svg-container').innerHTML = smoothSvgData;
  }, 128)
);

document.querySelector('#download').addEventListener('click', () => {
  const link = document.createElement('a');
  const canvasDrawEl: HTMLCanvasElement = document.querySelector('canvas#draw');

  link.download = 'PINTR.png';
  link.href = canvasDrawEl.toDataURL();
  link.click();
});

document.querySelector('#downloadSvg').addEventListener('click', () => {
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

document.querySelector('#downloadSmoothSvg').addEventListener('click', () => {
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
