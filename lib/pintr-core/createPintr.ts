import { tweenValue } from './math';
import { createRandom } from './random';
import { scanLine } from './scan';
import { createSource } from './source';

import type {
  PintrConfig,
  PintrImage,
  PintrLine,
  PintrPoint,
  PintrSession,
} from './types';

// PINTR picks one line at a time. Everything it needs to pick the next one lives
// in this closure, so a drawing can always be continued: just call `next` again.
export function createPintr({
  image,
  config,
  seed = Math.floor(Math.random() * 0x100000000),
}: {
  image: PintrImage;
  config: PintrConfig;
  // a uint32, the same seed always makes the same drawing
  seed?: number;
}): PintrSession {
  const WIDTH = image.width;
  const HEIGHT = image.height;
  const { contrast, definition, singleLine, strokeWidth } = config;

  // DERIVED RESULTS
  const tweenDefinition = Math.round(
    tweenValue(definition, [
      [0, 3],
      [50, 15],
      [100, 75],
    ])
  );

  const eraseAlpha =
    (100 -
      Math.round(
        tweenValue(contrast, [
          [0, 20],
          [50, 67],
          [100, 90],
        ])
      )) /
    100;

  const updateSampleRate = 100 - Math.floor(tweenDefinition / 2);

  // Our own copy of the image, the lines we draw get erased from it. It is
  // column-major: the pixel at x,y is S[x * HEIGHT + y].
  const source = createSource(WIDTH, HEIGHT, image.gray);
  const S = source.gray;
  const random = createRandom(seed);

  let cursor: PintrPoint = [Math.floor(WIDTH / 2), Math.floor(HEIGHT / 2)];
  let pendingLines: PintrLine[] = [];
  let lineCount = 0;

  function drawSequenceLine(): PintrLine {
    let from = cursor;

    // if no `singleLine` hop to different points to find a new cursor
    let toFrom = singleLine ? 0 : tweenDefinition;
    while (toFrom--) {
      const tmpFrom: PintrPoint = [random.int(WIDTH), random.int(HEIGHT)];
      if (S[from[0] * HEIGHT + from[1]] > S[tmpFrom[0] * HEIGHT + tmpFrom[1]]) {
        from = tmpFrom;
      }
    }

    // now we look at different places to expand
    let remainingCursorsToExplore = random.int(
      tweenDefinition,
      tweenDefinition * 2
    );
    let to: PintrPoint = [random.int(WIDTH), random.int(HEIGHT)];
    let light = 255;
    while (remainingCursorsToExplore--) {
      const tmpTo: PintrPoint = [random.int(WIDTH), random.int(HEIGHT)];
      const tmpLight = scanLine(from, tmpTo, S, HEIGHT);
      if (tmpLight <= light) {
        light = tmpLight;
        to = tmpTo;
      }
    }

    cursor = to;
    return [from, to];
  }

  function next(): PintrLine {
    // here we put the changes back to the src, so the next lines look for the
    // places that still need ink
    if (lineCount % updateSampleRate === 0) {
      source.erase(pendingLines, strokeWidth * 1.5, eraseAlpha);
      pendingLines = [];
    }

    const line = drawSequenceLine();
    pendingLines.push(line);
    lineCount++;

    return line;
  }

  return { next };
}
