import { tweenValue } from './math';
import { createRandom } from './random';
import { scanLine } from './scan';
import { createSource } from './source';
import type {
  PintrBatch,
  PintrConfig,
  PintrImage,
  PintrLine,
  PintrPoint,
  PintrSession,
} from './types';
import { PintrError } from './types';

const MAX_PIXELS = 100_000_000;

function validateImage(image: PintrImage) {
  if (!Number.isInteger(image.width) || !Number.isInteger(image.height)) {
    throw new PintrError('image dimensions must be integers');
  }
  if (image.width <= 0 || image.height <= 0) {
    throw new PintrError('image dimensions must be positive');
  }
  if (image.width * image.height > MAX_PIXELS) {
    throw new PintrError('image is too large');
  }
  if (!(image.gray instanceof Uint8Array)) {
    throw new PintrError('image.gray must be a Uint8Array');
  }
  if (image.gray.length !== image.width * image.height) {
    throw new PintrError('image.gray has the wrong length');
  }
}

function validateConfig(config: PintrConfig) {
  if (!Number.isFinite(config.contrast) || config.contrast < 0 || config.contrast > 100) {
    throw new PintrError('contrast must be between 0 and 100');
  }
  if (
    !Number.isFinite(config.definition) ||
    config.definition < 0 ||
    config.definition > 100
  ) {
    throw new PintrError('definition must be between 0 and 100');
  }
  if (typeof config.singleLine !== 'boolean') {
    throw new PintrError('singleLine must be a boolean');
  }
  if (!Number.isFinite(config.strokeWidth) || config.strokeWidth <= 0) {
    throw new PintrError('strokeWidth must be greater than zero');
  }
}

export function createPintr(input: {
  image: PintrImage;
  config: PintrConfig;
  seed?: number;
}): PintrSession {
  const { image } = input;
  const seed =
    input.seed === undefined
      ? Math.floor(Math.random() * 0x100000000)
      : input.seed;

  validateImage(image);
  validateConfig(input.config);
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new PintrError('seed must be a uint32');
  }

  // Everything needed to continue a drawing stays in this closure. Calling
  // next() later resumes from these values without replaying earlier lines.
  const config = { ...input.config };
  const tweenDefinition = Math.round(
    tweenValue(config.definition, [
      [0, 3],
      [50, 15],
      [100, 75],
    ])
  );
  const feedbackAlpha =
    (100 -
      Math.round(
        tweenValue(config.contrast, [
          [0, 20],
          [50, 67],
          [100, 90],
        ])
      )) /
    100;
  const updateSampleRate = 100 - Math.floor(tweenDefinition / 2);
  const source = createSource(image.width, image.height, image.gray);
  const random = createRandom(seed);
  let pendingLines: PintrLine[] = [];
  let cursor: PintrPoint = [
    Math.floor(image.width / 2),
    Math.floor(image.height / 2),
  ];
  let generatedLineCount = 0;

  function drawSequenceLine() {
    let from = cursor;

    // if no `singleLine` hop to different points to find a new cursor
    let toFrom = config.singleLine ? 0 : tweenDefinition;
    while (toFrom--) {
      const tmpFrom: PintrPoint = [
        random.int(image.width),
        random.int(image.height),
      ];
      if (
        source.gray[from[0] * image.height + from[1]] >
        source.gray[tmpFrom[0] * image.height + tmpFrom[1]]
      ) {
        from = tmpFrom;
      }
    }

    // now we look at different places to expand
    let remainingCursorsToExplore = random.int(
      tweenDefinition,
      tweenDefinition * 2
    );
    let to: PintrPoint = [random.int(image.width), random.int(image.height)];
    let light = 255;
    while (remainingCursorsToExplore--) {
      const tmpTo: PintrPoint = [
        random.int(image.width),
        random.int(image.height),
      ];
      const tmpLight = scanLine(from, tmpTo, source.gray, image.height);
      if (tmpLight <= light) {
        light = tmpLight;
        to = tmpTo;
      }
    }
    light = scanLine(from, to, source.gray, image.height);

    const line: PintrLine = [from, to];
    pendingLines.push(line);
    cursor = line[1];

    return line;
  }

  function next(lineCount: number): PintrBatch {
    if (!Number.isInteger(lineCount) || lineCount <= 0) {
      throw new PintrError('next() lineCount must be a positive integer');
    }

    const startLine = generatedLineCount;
    const batch: PintrLine[] = [];

    for (let i = 0; i < lineCount; i++) {
      // Keep this before the next line: exactly R generated lines remain pending
      // until line R asks the source to refresh.
      if (generatedLineCount % updateSampleRate === 0) {
        source.erase(pendingLines, config.strokeWidth * 1.5, feedbackAlpha);
        pendingLines = [];
      }
      batch.push(drawSequenceLine());
      generatedLineCount++;
    }

    return {
      startLine,
      endLine: generatedLineCount,
      lines: batch,
    };
  }

  return {
    width: image.width,
    height: image.height,
    seed,
    get lineCount() {
      return generatedLineCount;
    },
    next,
  };
}
