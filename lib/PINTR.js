import { imageToRawData, ctxToRGBGrayscaleMatrix } from 'canvas-image-utils';

import Draw from './draw.js';
import { canvasDataToGrayscale } from './canvasDataToGrayscale.js';
import { scanLine } from './scan.js';
import { intRnd } from './utils.js';

const DRAW_SIZE = 1080;
// const SCALE =
//   (window.devicePixelRatio * Math.min(window.innerHeight, window.innerWidth)) /
//   DRAW_SIZE;

const SCALE = 1;

let S = null;
let COORDS = null;
let CURRENT_DRAWING_ID = null;

const canvasSrc = document.createElement('canvas');

export async function pinterCreator(imgSrc, options = {}) {
  const { canvasDrawEl, onDraw, onFinish, onLoad } = options;

  const data = await imageToRawData(imgSrc, {
    size: DRAW_SIZE,
    canvas: canvasSrc,
    crop: false,
  });
  const WIDTH = data.width;
  const HEIGHT = data.height;

  canvasSrc.width = WIDTH;
  canvasSrc.height = HEIGHT;
  const srcCtx = canvasSrc.getContext('2d');
  const pencilSrc = Draw(srcCtx);

  const canvasDraw = canvasDrawEl || document.createElement('canvas');
  canvasDraw.width = WIDTH * SCALE;
  canvasDraw.height = HEIGHT * SCALE;

  const srcImgEl = document.querySelector('#srcImg');
  srcImgEl.style.aspectRatio = WIDTH / HEIGHT;

  const drawCtx = canvasDraw.getContext('2d');
  drawCtx.scale(SCALE, SCALE);

  const pencilDraw = Draw(drawCtx);

  console.log('> Starting PINTR');
  onLoad &&
    onLoad({
      width: WIDTH,
      height: HEIGHT,
    });

  const { canvasData, averageLightness } = canvasDataToGrayscale(data);

  // document.body.appendChild(canvasSrc);
  // document.body.appendChild(canvasDraw);

  async function render({ config }) {
    console.log('> Render PINTR', config);

    CURRENT_DRAWING_ID = new Date().getTime();
    COORDS = [];
    srcCtx.putImageData(canvasData, 0, 0);
    S = ctxToRGBGrayscaleMatrix(srcCtx);

    let startTime = new Date().getTime();
    let cursor = [Math.floor(WIDTH / 2), Math.floor(HEIGHT / 2)];

    function drawSequenceLine() {
      let from = cursor;

      // if no `singleLine` hop to different points to find a new cursor
      let toFrom = config.singleLine ? 0 : config.precisionRange;
      while (toFrom--) {
        let tmpFrom = [intRnd(WIDTH), intRnd(HEIGHT)];
        if (S[from[0]][from[1]] > S[tmpFrom[0]][tmpFrom[1]]) {
          from = tmpFrom;
        }
      }

      // now we look at different places to expand
      let remainingCursorsToExplore = intRnd(
        config.precisionRange,
        config.precisionRange * 2
      );
      let to;
      let light = 255;
      while (remainingCursorsToExplore--) {
        let tmpTo = [intRnd(WIDTH), intRnd(HEIGHT)];
        const tmpLight = scanLine(from, tmpTo, S);
        if (tmpLight <= light) {
          light = tmpLight;
          to = tmpTo;
        }
      }
      light = scanLine(from, to, S);

      COORDS.push([from, to]);

      pencilDraw.lineBuffer(from, to, {
        color: `#000`,
      });
      pencilSrc.lineBuffer(from, to, {
        color: config.substractionColor,
      });
      cursor = to;
    }

    const totalLinesToDraw = Math.floor(
      (config.baseLineNumber / averageLightness) * 128
    );
    let remainingLines = totalLinesToDraw;
    function drawLinesInBatch(currentDrawing) {
      return new Promise((resolve) => {
        const time = new Date().getTime();
        while (new Date().getTime() < time + 15 && remainingLines-- > 0) {
          if (currentDrawing !== CURRENT_DRAWING_ID) return;

          // here we put the changes back to the src and update our matrix
          if (remainingLines % config.updateSampleRate === 0) {
            pencilSrc.stroke({
              color: config.substractionColor,
              width: config.strokeWidth * 1.5,
            });
            S = ctxToRGBGrayscaleMatrix(srcCtx);
          }
          drawSequenceLine();
        }

        pencilDraw.stroke({
          color: config.addColor,
          width: config.strokeWidth * 1,
        });
        window.requestAnimationFrame(resolve);
      });
    }
    async function keepBatching(currentDrawing) {
      while (remainingLines > 0 && currentDrawing === CURRENT_DRAWING_ID) {
        await drawLinesInBatch(currentDrawing);
        onDraw && onDraw({ coords: COORDS });
      }
      onDraw && onDraw({ coords: COORDS });
      onFinish && onFinish({ coords: COORDS });

      let endTime = new Date().getTime();
      console.log(
        '> Lines per second:',
        (totalLinesToDraw / (endTime - startTime)) * 1000
      );
    }
    keepBatching(CURRENT_DRAWING_ID);
  }

  return {
    render,
  };
}

// if (config.faceApi) {
//   try {
//     await faceDetector(canvasSrc, data.ctx);
//   } catch (e) {
//     console.warn('No face detected or faceApi not working.');
//   }
// }
