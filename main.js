import { imageToRawData, ctxToRGBGrayscaleMatrix } from 'canvas-image-utils';

import { pinterCreator } from './lib/PINTR.js';

import { canvasDataToGrayscale } from './lib/canvasDataToGrayscale.js';
import { scanLine } from './lib/scan.js';
import { generateSvg } from './lib/svg.js';
import { generateSmoothSvg } from './lib/smooth-svg.js';

import { intRnd, debounce } from './lib/utils.js';
import { faceDetector } from './lib/face.js';

import Draw from './lib/draw.js';
// import DrawLiveSvg from "./lib/live-svg.js";

const DRAW_SIZE = 1080;

window.IMAGE_SRC = './test.jpg';
window.CURRENT_DRAWING = new Date().getTime();
window.COORDS = [];
window.CURRENT_IMAGE_SIZE = [DRAW_SIZE, DRAW_SIZE];

const ORIGINAL_CONFIG = {
  addColor: '#000',
  baseLineNumber: 3600,
  faceApi: false,
  precisionRange: [16, 32],
  singleLine: true,
  strokeWidth: 1.25,
  substractionColor: 'rgba(255, 255, 255, 30%)',
  updateSampleRate: 90,
};
const CONFIG = JSON.parse(JSON.stringify(ORIGINAL_CONFIG));

const canvasSrcEl = document.querySelector('canvas#src');
const drawEl = document.querySelector('canvas#draw');
drawEl.width = DRAW_SIZE;
drawEl.height = DRAW_SIZE;
const ctx = drawEl.getContext('2d');
const draw = Draw(ctx);
// const liveSvg = DrawLiveSvg(document.querySelector(".svg-container"));

const S = {
  matrix: [],
};

async function main(imgSrc) {
  console.log(CONFIG);

  const startTime = new Date().getTime();

  window.CURRENT_DRAWING = new Date().getTime();
  window.COORDS = [];

  // liveSvg.clear();

  document.querySelector('#srcimg').style.backgroundImage = `url("${imgSrc}")`;

  const data = await imageToRawData(imgSrc, {
    size: DRAW_SIZE,
    canvas: canvasSrcEl,
    crop: false,
  });

  // const PINTR = pinterCreator(data);

  const DATA_WIDTH = data.width;
  const DATA_HEIGHT = data.height;

  window.CURRENT_IMAGE_SIZE = [DATA_WIDTH, DATA_HEIGHT];

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, DATA_WIDTH, DATA_HEIGHT);

  document.documentElement.style.setProperty('--sizew', `${DATA_WIDTH / 2}px`);
  document.documentElement.style.setProperty('--sizeh', `${DATA_HEIGHT / 2}px`);
  drawEl.width = DATA_WIDTH;
  drawEl.height = DATA_HEIGHT;

  const { canvasData, averageLightness } = canvasDataToGrayscale(data);
  data.ctx.putImageData(canvasData, 0, 0);

  if (CONFIG.faceApi) {
    try {
      await faceDetector(canvasSrcEl, data.ctx);
    } catch (e) {
      console.warn('No face detected or FaceAPI not working.');
    }
  }

  document.querySelector('.loading').style.display = 'none';

  const ctxSrc = data.ctx;

  S.matrix = ctxToRGBGrayscaleMatrix(ctxSrc);
  // S.arr = ctxToRawUint8Array(ctxSrc);

  const drawSrc = Draw(data.ctx);

  let lP = [Math.floor(DATA_WIDTH / 2), Math.floor(DATA_HEIGHT / 2)];

  while (S.matrix[lP[0]][lP[1]] === 255 * 3) {
    lP = [
      Math.floor(Math.random() * DATA_WIDTH),
      Math.floor(Math.random() * DATA_HEIGHT),
    ];
  }

  // while (S.arr[lP[0] * DATA_WIDTH + lP[1]] === 255 * 3) {
  //   lP = [
  //     Math.floor(Math.random() * DATA_WIDTH),
  //     Math.floor(Math.random() * DATA_HEIGHT),
  //   ];
  // }

  function drawSequenceLine() {
    let from = lP;

    let toFrom = CONFIG.singleLine ? 0 : CONFIG.precisionRange[0] * 2;
    while (toFrom--) {
      let tmpFrom = [
        Math.floor(Math.random() * DATA_WIDTH),
        Math.floor(Math.random() * DATA_HEIGHT),
      ];

      if (S.matrix[from[0]][from[1]] > S.matrix[tmpFrom[0]][tmpFrom[1]]) {
        from = tmpFrom;
      }

      // if (
      //   S.arr[from[0] * DATA_WIDTH + from[1]] >
      //   S.arr[tmpFrom[0] * DATA_WIDTH + tmpFrom[1]]
      // ) {
      //   from = tmpFrom;
      // }
    }

    let toExplore = intRnd(...CONFIG.precisionRange);

    let to;
    let light = 255;
    while (toExplore--) {
      let tmpTo = [
        Math.floor(Math.random() * DATA_WIDTH),
        Math.floor(Math.random() * DATA_HEIGHT),
      ];

      const tmpLight = scanLine(from, tmpTo, S.matrix);
      // const tmpLight = scanLineUint8(from, tmpTo, S.arr, DATA_WIDTH);

      if (tmpLight <= light) {
        light = tmpLight;
        to = tmpTo;
      }
    }

    light = scanLine(from, to, S.matrix);
    // light = scanLineUint8(from, to, S.arr, DATA_WIDTH);

    window.COORDS.push([from, to]);

    // liveSvg.lineBuffer(from, to);

    draw.lineBuffer(from, to, {
      color: `#000`,
    });
    drawSrc.lineBuffer(from, to, {
      color: CONFIG.substractionColor,
    });

    lP = to;
  }

  let initialC = Math.floor((CONFIG.baseLineNumber / averageLightness) * 128);
  let c = initialC;

  function drawLinesInBatch(currentDrawing) {
    return new Promise((resolve) => {
      const time = new Date().getTime();
      while (new Date().getTime() < time + 16 && c-- > 0) {
        if (currentDrawing !== window.CURRENT_DRAWING) return;

        if (c % CONFIG.updateSampleRate === 0) {
          // liveSvg.stroke();
          // draw.stroke({
          //   color: CONFIG.addColor,
          //   width: CONFIG.strokeWidth * 1,
          // });
          drawSrc.stroke({
            color: CONFIG.substractionColor,
            width: CONFIG.strokeWidth * 1.5,
          });

          S.matrix = ctxToRGBGrayscaleMatrix(ctxSrc);
          // S.arr = ctxToRawUint8Array(ctxSrc);
        }
        drawSequenceLine();
      }

      // liveSvg.stroke();
      draw.stroke({ color: CONFIG.addColor, width: CONFIG.strokeWidth * 1 });
      // drawSrc.stroke({
      //   color: CONFIG.substractionColor,
      //   width: CONFIG.strokeWidth * 1.5,
      // });

      // window.setTimeout(resolve, 4)
      // resolve()
      window.requestAnimationFrame(resolve);
    });
  }
  async function keepBatching(currentDrawing) {
    while (c > 0 && currentDrawing === window.CURRENT_DRAWING) {
      await drawLinesInBatch(currentDrawing);
    }

    if (CONFIG.makeSmoothSvg) {
      const smoothSvgData = generateSmoothSvg(window.COORDS, {
        ...CONFIG,
        size: window.CURRENT_IMAGE_SIZE,
        smoothing: document.querySelector('#inputSmoothness').value / 100,
      });
      document.querySelector('.smooth-svg-container').innerHTML = smoothSvgData;
    }

    console.log(
      'Lines per second:',
      (CONFIG.baseLineNumber / (new Date().getTime() - startTime)) * 1000
    );
  }
  keepBatching(window.CURRENT_DRAWING);
}
// main(window.IMAGE_SRC);

function readFile() {
  if (this.files && this.files[0]) {
    const FR = new FileReader();
    FR.addEventListener('load', function (e) {
      window.IMAGE_SRC = e.target.result;
      main(window.IMAGE_SRC);
    });

    FR.readAsDataURL(this.files[0]);
  }
}

// UI
function onChangeSettings() {
  const lines = document.querySelector("input[type='range']#lines").value;
  const singleline = document.querySelector(
    "input[type='range']#singleline"
  ).value;
  const faceApi = document.querySelector("input[type='range']#faceapi").value;
  const contrast = document.querySelector("input[type='range']#contrast").value;
  const definition = document.querySelector(
    "input[type='range']#definition"
  ).value;
  const strokeWidth = document.querySelector(
    "input[type='range']#strokeWidth"
  ).value;

  const makeSmoothSvg = document.querySelector(
    "input[type='range']#makeSmoothSvg"
  ).value;

  CONFIG.baseLineNumber = (ORIGINAL_CONFIG.baseLineNumber / 50) * lines;
  CONFIG.substractionColor = `rgba(255, 255, 255, ${100 - contrast}%)`;
  CONFIG.precisionRange = [Number(definition), Number(definition * 2)];
  CONFIG.singleLine = Number(singleline) ? true : false;
  CONFIG.faceApi = Number(faceApi) ? true : false;
  CONFIG.strokeWidth = Number(strokeWidth);
  CONFIG.makeSmoothSvg =
    CONFIG.singleLine && (Number(makeSmoothSvg) ? true : false);

  if (CONFIG.faceApi) {
    document.querySelector('.loading').style.display = 'block';
  }

  document.querySelector('.experimental--smoth-svg--container').style.display =
    CONFIG.makeSmoothSvg ? 'block' : 'none';

  document.querySelector(
    '.experimental--smoth-svg--container--warning'
  ).style.display = CONFIG.singleLine ? 'none' : 'block';

  main(window.IMAGE_SRC);
}
onChangeSettings();

document.querySelector('#inp').addEventListener('change', readFile);
document.querySelector('#inputbutton').addEventListener('click', () => {
  document.querySelector('#inp').click();
});
document.querySelectorAll("input[type='range']").forEach((input) => {
  // TODO handle this better
  if (input.id === 'inputSmoothness') {
    input.addEventListener(
      'change',
      debounce(() => {
        const smoothSvgData = generateSmoothSvg(window.COORDS, {
          ...CONFIG,
          size: window.CURRENT_IMAGE_SIZE,
          smoothing: document.querySelector('#inputSmoothness').value / 100,
        });
        document.querySelector('.smooth-svg-container').innerHTML =
          smoothSvgData;
      }, 128)
    );
  } else {
    input.addEventListener('change', debounce(onChangeSettings, 256));
  }
});

document.querySelector('#download').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'PINTR.png';
  link.href = document.querySelector('canvas#draw').toDataURL();
  link.click();
});

document.querySelector('#downloadsvg').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'PINTR.svg';
  const svgData = generateSvg(window.COORDS, {
    ...CONFIG,
    size: window.CURRENT_IMAGE_SIZE,
  });
  // const svgData = generateSmoothSvg(window.COORDS, CONFIG);

  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  link.href = svgUrl;
  link.click();
});

document.querySelector('#downloadSmoothSvg').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'PINTR.svg';
  const smoothSvgData = generateSmoothSvg(window.COORDS, {
    CONFIG,
    size: window.CURRENT_IMAGE_SIZE,
    smoothing: document.querySelector('#inputSmoothness').value / 100,
  });
  const svgBlob = new Blob([smoothSvgData], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const svgUrl = URL.createObjectURL(svgBlob);
  link.href = svgUrl;
  link.click();
});
