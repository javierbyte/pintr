import { imageToRawData, ctxToRGBGrayscaleMatrix } from 'canvas-image-utils';

import Draw from './draw';
import { canvasDataToGrayscale } from './canvasDataToGrayscale';
import { scanLine } from './scan';
import { intRnd, tweenValue } from './utils';

import type { configType } from '../main';

const DRAW_SIZE = 1080;
const SCALE = 1;

export type Coord = [number, number];

let S: Uint8Array[] = [];
let COORDS: [Coord, Coord][] = [];
let CURRENT_DRAWING_ID: number = new Date().getTime() - 1;

const canvasSrc = document.createElement('canvas');

export async function pinterCreator(
  imgSrc: string,
  {
    canvasDrawEl,
    onDraw,
    onFinish,
    onLoad,
  }: {
    canvasDrawEl: HTMLCanvasElement;
    onDraw: ({ coords }: { coords: typeof COORDS }) => void;
    onFinish: ({ coords }: { coords: typeof COORDS }) => void;
    onLoad: ({ width, height }: { width: number; height: number }) => void;
  }
) {
  const data = await imageToRawData(imgSrc, {
    size: DRAW_SIZE,
    canvas: canvasSrc,
    crop: false,
  });
  const WIDTH = data.width;
  const HEIGHT = data.height;

  canvasSrc.width = WIDTH;
  canvasSrc.height = HEIGHT;
  const srcCtx: CanvasRenderingContext2D | null = canvasSrc.getContext('2d');

  if (!srcCtx) {
    throw new Error("Failed to initiate 'CanvasRenderingContext2D'");
  }

  const pencilSrc = Draw(srcCtx);

  const canvasDraw = canvasDrawEl || document.createElement('canvas');
  canvasDraw.width = WIDTH * SCALE;
  canvasDraw.height = HEIGHT * SCALE;

  const srcImgEl: HTMLImageElement | null = document.querySelector('#srcImg');
  const drawCtx: CanvasRenderingContext2D | null = canvasDraw.getContext('2d');

  if (!srcImgEl) {
    throw new Error('Failed to initiate srcImgEl');
  }
  if (!drawCtx) {
    throw new Error('Failed to initiate CanvasRenderingContext2D');
  }

  srcImgEl.style.aspectRatio = String(WIDTH / HEIGHT);
  drawCtx.scale(SCALE, SCALE);

  const pencilDraw = Draw(drawCtx);

  console.log('> Starting PINTR');
  onLoad({
    width: WIDTH,
    height: HEIGHT,
  });

  const { canvasData, averageLightness } = canvasDataToGrayscale(data);

  // document.body.appendChild(canvasSrc);
  // document.body.appendChild(canvasDraw);

  async function render(config: configType) {
    console.log('> Render PINTR', config);

    const { density, singleLine, contrast, definition, strokeWidth } = config;

    CURRENT_DRAWING_ID = new Date().getTime();
    COORDS = [];

    // DERIVED RESULTS
    const tweenDefinition = Math.round(
      tweenValue(definition, [
        [0, 3],
        [50, 15],
        [100, 75],
      ])
    );

    const baseLineNumber = Math.round(
      tweenValue(density, [
        [0, 500],
        [50, 3000],
        [100, 7000],
      ])
    );

    const PLUS_COLOR = `rgba(0, 0, 0, 255)`;
    const MINUS_COLOR = `rgba(255, 255, 255, ${
      (100 -
        Math.round(
          tweenValue(contrast, [
            [0, 20],
            [50, 67],
            [100, 90],
          ])
        )) /
      100
    })`;

    const updateSampleRate = 100 - Math.floor(tweenDefinition / 2);

    if (!srcCtx) {
      throw new Error('Canvas error');
    }

    srcCtx.putImageData(canvasData, 0, 0);
    S = ctxToRGBGrayscaleMatrix(srcCtx);

    let startTime = new Date().getTime();
    let cursor: Coord = [Math.floor(WIDTH / 2), Math.floor(HEIGHT / 2)];

    function drawSequenceLine() {
      let from = cursor;

      // if no `singleLine` hop to different points to find a new cursor
      let toFrom = singleLine ? 0 : tweenDefinition;
      while (toFrom--) {
        let tmpFrom: Coord = [intRnd(WIDTH), intRnd(HEIGHT)];
        if (S[from[0]][from[1]] > S[tmpFrom[0]][tmpFrom[1]]) {
          from = tmpFrom;
        }
      }

      // now we look at different places to expand
      let remainingCursorsToExplore = intRnd(
        tweenDefinition,
        tweenDefinition * 2
      );
      let to: Coord = [intRnd(WIDTH), intRnd(HEIGHT)];
      let light = 255;
      while (remainingCursorsToExplore--) {
        let tmpTo: Coord = [intRnd(WIDTH), intRnd(HEIGHT)];
        const tmpLight = scanLine(from, tmpTo, S);
        if (tmpLight <= light) {
          light = tmpLight;
          to = tmpTo;
        }
      }
      light = scanLine(from, to, S);

      COORDS.push([from, to]);

      pencilDraw.lineBuffer(from, to);
      pencilSrc.lineBuffer(from, to);
      cursor = to;
    }

    const totalLinesToDraw = Math.floor(
      (baseLineNumber / averageLightness) * 128
    );
    let remainingLines = totalLinesToDraw;
    function drawLinesInBatch(currentDrawing: number) {
      return new Promise((resolve) => {
        const time = new Date().getTime();
        while (new Date().getTime() < time + 15 && remainingLines-- > 0) {
          if (currentDrawing !== CURRENT_DRAWING_ID) return;

          // here we put the changes back to the src and update our matrix
          if (remainingLines % updateSampleRate === 0) {
            pencilSrc.stroke({
              color: MINUS_COLOR,
              width: strokeWidth * 1.5,
            });
            if (!srcCtx) {
              throw new Error('Canvas error');
            }
            S = ctxToRGBGrayscaleMatrix(srcCtx);
          }
          drawSequenceLine();
        }

        pencilDraw.stroke({
          color: PLUS_COLOR,
          width: strokeWidth * 1,
        });
        window.requestAnimationFrame(resolve);
      });
    }
    async function keepBatching(currentDrawing: number) {
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
