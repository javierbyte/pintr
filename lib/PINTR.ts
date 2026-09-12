import { imageToRawData } from 'canvas-image-utils';

import Draw from './draw';
import { createPintr } from './pintr-core';
import type {
  PintrConfig as CoreConfig,
  PintrLine,
  PintrSession,
} from './pintr-core';
import { preparePintrImage } from './pintr-core/utils';

const DRAW_SIZE = 1080;

export type Coord = [number, number];
export type PintrConfig = CoreConfig;

type Session = {
  pintr: PintrSession;
  strokeWidth: number;
  target: number;
};

function toCoords(line: PintrLine): [Coord, Coord] {
  return [
    [line[0][0], line[0][1]],
    [line[1][0], line[1][1]],
  ];
}

// Browser compatibility around the platform-neutral generator. The app still
// owns image URLs, frame pacing, and visible Canvas strokes; core only picks lines.
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
  const canvasSrc = document.createElement('canvas');
  const data = await imageToRawData(imgSrc, {
    size: DRAW_SIZE,
    canvas: canvasSrc,
    crop: false,
  });
  const WIDTH = data.width;
  const HEIGHT = data.height;
  const image = preparePintrImage({
    width: WIDTH,
    height: HEIGHT,
    rgba: data.data,
  });

  const canvasDraw = canvasDrawEl || document.createElement('canvas');
  canvasDraw.width = WIDTH;
  canvasDraw.height = HEIGHT;

  const drawCtx: CanvasRenderingContext2D | null = canvasDraw.getContext('2d');

  if (!drawCtx) throw new Error('Failed to initiate CanvasRenderingContext2D');

  const drawContext: CanvasRenderingContext2D = drawCtx;
  onLoad({ width: WIDTH, height: HEIGHT });

  let pencilDraw = Draw(drawContext);
  let session: Session | null = null;
  let running = false;
  let stopped = false;

  // Draws lines toward `session.target` within a single ~15ms time budget, then
  // resolves on the next animation frame so the canvas can paint between batches.
  // Requesting one core line at a time keeps the target exact even when Definition
  // is slow.
  function drawBatch(currentSession: Session) {
    return new Promise<void>((resolve) => {
      const time = Date.now();
      const coords: [Coord, Coord][] = [];

      while (
        Date.now() < time + 15 &&
        currentSession.pintr.lineCount < currentSession.target
      ) {
        const line = currentSession.pintr.next(1).lines[0];
        const coord = toCoords(line);
        coords.push(coord);
        pencilDraw.lineBuffer(coord[0], coord[1]);
      }

      pencilDraw.stroke({
        color: 'rgba(0, 0, 0, 255)',
        width: currentSession.strokeWidth,
      });

      const done = currentSession.pintr.lineCount >= currentSession.target;
      if (coords.length || done) onProgress && onProgress({ coords, done });

      window.requestAnimationFrame(() => resolve());
    });
  }

  // Keeps batching until the drawn count reaches the current target, then idles;
  // raising the target via `requestLines` restarts it. The core session stays
  // warm while idle, so it continues without replaying the existing drawing.
  // Reading `session` each iteration also picks up a replacement made by start().
  async function pump() {
    if (running) return;
    running = true;
    while (
      !stopped &&
      session &&
      session.pintr.lineCount < session.target
    ) {
      await drawBatch(session);
    }
    running = false;
  }

  // Start a fresh generator for this image and config. The core owns only the
  // state needed to choose future lines; the app collects the returned coords.
  function start(config: PintrConfig) {
    drawContext.clearRect(0, 0, WIDTH, HEIGHT);
    pencilDraw = Draw(drawContext, config.singleLine);
    session = {
      pintr: createPintr({ image, config }),
      strokeWidth: config.strokeWidth,
      target: 0,
    };
  }

  // Set the target line count and return immediately. Lower targets simply stop
  // generation; raising the target later continues the same in-memory session.
  function requestLines(targetCount: number) {
    if (!session) throw new Error('PINTR: call start() before requestLines()');
    if (!Number.isInteger(targetCount) || targetCount < 0) {
      throw new Error('PINTR: target line count must be a non-negative integer');
    }

    session.target = targetCount;
    if (!running) pump();
  }

  // Permanently halt this instance when a new image takes over the canvas.
  function stop() {
    stopped = true;
  }

  return {
    start,
    requestLines,
    stop,
  };
}
