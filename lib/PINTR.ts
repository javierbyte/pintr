import { imageToRawData, ctxToRGBGrayscaleMatrix } from 'canvas-image-utils';

import Draw from './draw';
import { canvasDataToGrayscale } from './canvasDataToGrayscale';
import { scanLine } from './scan';
import { intRnd, tweenValue } from './utils';

const DRAW_SIZE = 1080;

export type Coord = [number, number];

export type PintrConfig = {
  contrast: number;
  definition: number;
  singleLine: boolean;
  strokeWidth: number;
};

type Session = {
  singleLine: boolean;
  tweenDefinition: number;
  updateSampleRate: number;
  plusColor: string;
  minusColor: string;
  strokeWidth: number;
  target: number;
  drawnCount: number;
};

export async function pinterCreator(
  imgSrc: string,
  {
    canvasDrawEl,
    onLoad,
    onProgress,
  }: {
    canvasDrawEl: HTMLCanvasElement;
    onLoad: ({ width, height }: { width: number; height: number }) => void;
    onProgress?: ({
      coords,
      done,
    }: {
      coords: [Coord, Coord][];
      done: boolean;
    }) => void;
  }
) {
  // Per-instance drawing state, scoped to this closure so two instances never
  // collide (a superseded one may still be resolving a requestAnimationFrame).
  const canvasSrc = document.createElement('canvas');
  let S: Uint8Array[] = [];
  let COORDS: [Coord, Coord][] = [];
  let cursor: Coord = [0, 0];
  let running = false;
  let stopped = false;

  const data = await imageToRawData(imgSrc, {
    size: DRAW_SIZE,
    canvas: canvasSrc,
    crop: false,
  });
  const WIDTH = data.width;
  const HEIGHT = data.height;

  canvasSrc.width = WIDTH;
  canvasSrc.height = HEIGHT;
  const srcCtx: CanvasRenderingContext2D | null = canvasSrc.getContext('2d', {
    willReadFrequently: true,
  });

  if (!srcCtx) {
    throw new Error("Failed to initiate 'CanvasRenderingContext2D'");
  }

  let pencilSrc = Draw(srcCtx);

  const canvasDraw = canvasDrawEl || document.createElement('canvas');
  canvasDraw.width = WIDTH;
  canvasDraw.height = HEIGHT;

  const srcImgEl: HTMLImageElement | null = document.querySelector('#srcImg');
  const drawCtx: CanvasRenderingContext2D | null = canvasDraw.getContext('2d');

  if (!srcImgEl) {
    throw new Error('Failed to initiate srcImgEl');
  }
  if (!drawCtx) {
    throw new Error('Failed to initiate CanvasRenderingContext2D');
  }

  // Non-null aliases: the narrowing above doesn't carry into the nested closures.
  const srcContext: CanvasRenderingContext2D = srcCtx;
  const drawContext: CanvasRenderingContext2D = drawCtx;

  srcImgEl.style.aspectRatio = String(WIDTH / HEIGHT);

  let pencilDraw = Draw(drawCtx);
  onLoad({
    width: WIDTH,
    height: HEIGHT,
  });

  const { canvasData } = canvasDataToGrayscale(data);

  let session: Session | null = null;

  function drawSequenceLine(currentSession: Session) {
    let from = cursor;

    // if no `singleLine` hop to different points to find a new cursor
    let toFrom = currentSession.singleLine ? 0 : currentSession.tweenDefinition;
    while (toFrom--) {
      let tmpFrom: Coord = [intRnd(WIDTH), intRnd(HEIGHT)];
      if (S[from[0]][from[1]] > S[tmpFrom[0]][tmpFrom[1]]) {
        from = tmpFrom;
      }
    }

    // now we look at different places to expand
    let remainingCursorsToExplore = intRnd(
      currentSession.tweenDefinition,
      currentSession.tweenDefinition * 2
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

  // Draws lines toward `session.target` within a single ~15ms time budget, then
  // resolves on the next animation frame so the canvas can paint between batches.
  function drawBatch(currentSession: Session) {
    return new Promise<void>((resolve) => {
      const time = Date.now();
      const startCount = currentSession.drawnCount;

      while (
        Date.now() < time + 15 &&
        currentSession.drawnCount < currentSession.target
      ) {
        // here we put the changes back to the src and update our matrix
        if (currentSession.drawnCount % currentSession.updateSampleRate === 0) {
          pencilSrc.stroke({
            color: currentSession.minusColor,
            width: currentSession.strokeWidth * 1.5,
          });
          S = ctxToRGBGrayscaleMatrix(srcContext);
        }
        drawSequenceLine(currentSession);
        currentSession.drawnCount++;
      }

      pencilDraw.stroke({
        color: currentSession.plusColor,
        width: currentSession.strokeWidth * 1,
      });

      const newCoords = COORDS.slice(startCount, currentSession.drawnCount);
      const done = currentSession.drawnCount >= currentSession.target;
      onProgress && onProgress({ coords: newCoords, done });

      window.requestAnimationFrame(() => resolve());
    });
  }

  // Keeps batching until the drawn count reaches the current target, then idles;
  // raising the target via `requestLines` restarts it. The `running` flag keeps
  // a single loop alive, and it reads the live `session` each iteration so a
  // `start()` that swaps the session mid-flight is picked up once a batch resolves.
  async function pump() {
    if (running) return;
    running = true;
    while (!stopped && session && session.drawnCount < session.target) {
      await drawBatch(session);
    }
    running = false;
  }

  // (Re)initialise a drawing session. Resets all drawing state and captures the
  // config-derived values, but draws nothing until `requestLines` is called.
  function start(config: PintrConfig) {
    const { singleLine, contrast, definition, strokeWidth } = config;

    COORDS = [];

    const tweenDefinition = Math.round(
      tweenValue(definition, [
        [0, 3],
        [50, 15],
        [100, 75],
      ])
    );

    const plusColor = `rgba(0, 0, 0, 255)`;
    const minusColor = `rgba(255, 255, 255, ${
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

    // Clear the canvas and start a fresh pencil so no partial sub-path from a
    // previous session on this instance carries over.
    drawContext.clearRect(0, 0, WIDTH, HEIGHT);
    pencilDraw = Draw(drawContext);

    srcContext.putImageData(canvasData, 0, 0);
    pencilSrc = Draw(srcContext);
    S = ctxToRGBGrayscaleMatrix(srcContext);

    cursor = [Math.floor(WIDTH / 2), Math.floor(HEIGHT / 2)];

    session = {
      singleLine,
      tweenDefinition,
      updateSampleRate,
      plusColor,
      minusColor,
      strokeWidth,
      target: 0,
      drawnCount: 0,
    };
  }

  // Set the target line count for the current session. Returns immediately; the
  // pump loop catches up and streams the new lines via `onProgress`. Raising the
  // target draws more (continuing from the last line); lowering it below the
  // drawn count simply halts the loop — already-drawn lines are kept (the drawn
  // count never decreases) so raising it again resumes instantly.
  function requestLines(targetCount: number) {
    if (!session) {
      throw new Error('PINTR: call start() before requestLines()');
    }
    session.target = targetCount;
    if (!running) pump();
  }

  // Permanently halt this instance so its pump stops drawing — called when a new
  // image takes over the canvas.
  function stop() {
    stopped = true;
  }

  return {
    start,
    requestLines,
    stop,
  };
}
