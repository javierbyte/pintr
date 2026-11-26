import { drawLines } from './draw';
import { createPintr } from './pintr-core';
import { preparePintrImage } from './pintr-core/utils';

import type { PintrConfig, PintrSession } from './pintr-core';
import type { RgbaImage } from './pintr-core/utils';

export type Coord = [number, number];
export type { PintrConfig };

// The browser side of PINTR: the core only picks lines, this paces the work
// frame by frame and keeps the canvas showing the first `lineCount` of them.
export function pinterCreator(
  image: RgbaImage,
  canvasDrawEl: HTMLCanvasElement
) {
  const WIDTH = image.width;
  const HEIGHT = image.height;

  canvasDrawEl.width = WIDTH;
  canvasDrawEl.height = HEIGHT;
  const drawCtx = canvasDrawEl.getContext('2d') as CanvasRenderingContext2D;

  const grayscale = preparePintrImage(image);

  // Every line generated so far. Asking for fewer lines only hides the tail, so
  // asking for more later continues the same drawing instead of starting over.
  let COORDS: [Coord, Coord][] = [];
  let config: PintrConfig;
  let session: PintrSession;
  let lineCount = 0;
  let batching = false;
  let stopped = false;

  function getCoords() {
    return COORDS.slice(0, lineCount);
  }

  function repaint() {
    drawCtx.clearRect(0, 0, WIDTH, HEIGHT);
    drawLines(drawCtx, getCoords(), config);
  }

  function drawLinesInBatch() {
    const time = Date.now();
    const start = COORDS.length;

    while (Date.now() < time + 15 && COORDS.length < lineCount) {
      COORDS.push(session.next());
    }
    drawLines(drawCtx, COORDS.slice(start), config);

    // each batch is its own path, repaint so the corners between them join too
    if (COORDS.length >= lineCount && config.singleLine) repaint();

    return new Promise(window.requestAnimationFrame);
  }

  async function keepBatching() {
    if (batching) return;
    batching = true;
    while (!stopped && COORDS.length < lineCount) {
      await drawLinesInBatch();
    }
    batching = false;
  }

  // Start a new drawing of the same image.
  function render(newConfig: PintrConfig, newLineCount: number) {
    config = newConfig;
    session = createPintr({ image: grayscale, config });
    COORDS = [];
    setLineCount(newLineCount);
  }

  function setLineCount(newLineCount: number) {
    lineCount = newLineCount;
    repaint();
    keepBatching();
  }

  // Call it when another instance takes over the canvas.
  function stop() {
    stopped = true;
  }

  return {
    render,
    setLineCount,
    getCoords,
    stop,
  };
}
