import { pinterCreator } from './lib/PINTR.js';

import { generateSvg } from './lib/svg.js';
import { generateSmoothSvg } from './lib/smooth-svg.js';

import { debounce } from './lib/utils.js';

const DEFAULT_IMG = './test.jpg';

let CONFIG = {};
let GLOBAL = {
  currentImgSrc: DEFAULT_IMG,
  coords: null,
  width: null,
  height: null,
};

async function main(imgSrc) {
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
        smoothing:
          Number(document.querySelector('#inputSmoothness').value) / 100,
      });
      document.querySelector('.smooth-svg-container').innerHTML = smoothSvgData;
    },
  });
  document.querySelector('#srcImg').style.backgroundImage = `url("${imgSrc}")`;
  document.querySelector('.loading').style.display = 'none';
  PINTR.render({
    config: CONFIG,
  });
}

function readFile() {
  if (this.files && this.files[0]) {
    const FR = new FileReader();
    FR.addEventListener('load', function (e) {
      GLOBAL.currentImgSrc = e.target.result;
      main(e.target.result);
    });

    FR.readAsDataURL(this.files[0]);
  }
}

// UI
function get(selector, type) {
  if (type === 'number') return Number(document.querySelector(selector).value);
  else if (type === 'bool')
    return Boolean(Number(document.querySelector(selector).value));
  else return document.querySelector(selector).value;
}

function startNewDrawing() {
  const lines = get('#lines', 'number');
  const singleLine = get('#singleLine', 'bool');
  const contrast = get('#contrast', 'number');
  const definition = get('#definition', 'number');
  const strokeWidth = get('#strokeWidth', 'number');
  const makeSmoothSvg = get('#makeSmoothSvg', 'bool');

  CONFIG = {
    addColor: '#000',
    updateSampleRate: 90,
    baseLineNumber: 72 * lines,
    substractionColor: `rgba(255, 255, 255, ${100 - contrast}%)`,
    precisionRange: definition,
    singleLine,
    strokeWidth,
    makeSmoothSvg: singleLine && makeSmoothSvg,
  };

  document.querySelector('.experimental--smoth-svg--container').style.display =
    makeSmoothSvg ? 'block' : 'none';

  document.querySelector(
    '.experimental--smoth-svg--container--warning'
  ).style.display = singleLine ? 'none' : 'block';

  main(GLOBAL.currentImgSrc);
}
startNewDrawing();

// ADD LISTENERS
document.querySelector('#inputImageFile').addEventListener('change', readFile);
document.querySelector('#inputImageButton').addEventListener('click', () => {
  document.querySelector('#inputImageFile').click();
});

document.querySelectorAll('[data-start-drawing]').forEach((input) => {
  input.addEventListener('change', debounce(startNewDrawing, 256));
});

document.querySelector('#inputSmoothness').addEventListener(
  'change',
  debounce(() => {
    const smoothSvgData = generateSmoothSvg(GLOBAL.coords, {
      ...CONFIG,
      size: [GLOBAL.width, GLOBAL.height],
      smoothing: document.querySelector('#inputSmoothness').value / 100,
    });
    document.querySelector('.smooth-svg-container').innerHTML = smoothSvgData;
  }, 128)
);

document.querySelector('#download').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'PINTR.png';
  link.href = document.querySelector('canvas#draw').toDataURL();
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
    CONFIG,
    size: [GLOBAL.width, GLOBAL.height],
    smoothing: document.querySelector('#inputSmoothness').value / 100,
  });
  const svgBlob = new Blob([smoothSvgData], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const svgUrl = URL.createObjectURL(svgBlob);
  link.href = svgUrl;
  link.click();
});
