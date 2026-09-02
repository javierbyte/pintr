import assert from 'node:assert/strict';
import test from 'node:test';

import { createPintr, restorePintr } from '../lib/pintr-core';
import {
  applyVignette,
  extendRgbaImage,
  frameRgbaImage,
  preparePintrImage,
  resizeRgbaImage,
} from '../lib/pintr-core/utils';
import { processSourceImage } from '../lib/preprocess';
import type { PintrConfig } from '../lib/pintr-core';
import type { SourceConfig } from '../lib/preprocess';

const CONFIG: PintrConfig = {
  contrast: 50,
  definition: 50,
  singleLine: true,
  strokeWidth: 1.5,
};

function rgbaFixture(width = 32, height = 24) {
  const rgba = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      rgba[i] = (x * 17 + y * 3) % 256;
      rgba[i + 1] = (x * 5 + y * 19) % 256;
      rgba[i + 2] = (x * 11 + y * 7) % 256;
      rgba[i + 3] = (x + y) % 9 === 0 ? 96 : 255;
    }
  }

  return { width, height, rgba };
}

function lines(session: ReturnType<typeof createPintr>) {
  return session.getLines().map((line) => [
    [line[0][0], line[0][1]],
    [line[1][0], line[1][1]],
  ]);
}

test('preparation is independent of Uint8Array clamping behavior', () => {
  const clamped = rgbaFixture();
  const plain = { ...clamped, rgba: new Uint8Array(clamped.rgba) };

  assert.deepEqual(
    preparePintrImage(clamped).gray,
    preparePintrImage(plain).gray
  );
});

test('same prepared image, config, and seed is deterministic', () => {
  const image = preparePintrImage(rgbaFixture());
  const a = createPintr({ image, config: CONFIG, seed: 1234 });
  const b = createPintr({ image, config: CONFIG, seed: 1234 });

  a.next(240);
  b.next(240);
  assert.deepEqual(lines(a), lines(b));
});

test('batch boundaries do not affect coordinates', () => {
  const image = preparePintrImage(rgbaFixture());
  const whole = createPintr({ image, config: CONFIG, seed: 42 });
  const partitioned = createPintr({ image, config: CONFIG, seed: 42 });

  whole.next(240);
  partitioned.next(17);
  partitioned.next(76);
  partitioned.next(1);
  partitioned.next(146);

  assert.deepEqual(lines(partitioned), lines(whole));
});

test('checkpoints resume exactly around every feedback boundary', () => {
  const image = preparePintrImage(rgbaFixture());
  // definition 50 maps to 15, so the refresh rate is 100 - floor(15 / 2).
  const R = 93;

  for (const split of [R - 1, R, R + 1, 2 * R - 1, 2 * R, 2 * R + 1]) {
    const target = split + 40;
    const uninterrupted = createPintr({ image, config: CONFIG, seed: 99 });
    uninterrupted.next(target);

    const before = createPintr({ image, config: CONFIG, seed: 99 });
    before.next(split);
    const continued = restorePintr(before.save());
    continued.next(target - split);

    assert.deepEqual(lines(continued), lines(uninterrupted), `split ${split}`);
  }
});

test('sessions do not share cursor, source, lines, or random state', () => {
  const image = preparePintrImage(rgbaFixture());
  const interleavedA = createPintr({ image, config: CONFIG, seed: 7 });
  const interleavedB = createPintr({ image, config: CONFIG, seed: 11 });
  const expectedA = createPintr({ image, config: CONFIG, seed: 7 });
  const expectedB = createPintr({ image, config: CONFIG, seed: 11 });

  interleavedA.next(100);
  interleavedB.next(40);
  interleavedA.next(120);
  interleavedB.next(180);
  expectedA.next(220);
  expectedB.next(220);

  assert.deepEqual(lines(interleavedA), lines(expectedA));
  assert.deepEqual(lines(interleavedB), lines(expectedB));
});

test('a session owns its working image state', () => {
  const original = preparePintrImage(rgbaFixture());
  const mutableGray = new Uint8Array(original.gray);
  const image = { ...original, gray: mutableGray };
  const pintr = createPintr({ image, config: CONFIG, seed: 101 });
  const expected = createPintr({ image: original, config: CONFIG, seed: 101 });

  mutableGray.fill(0);
  pintr.next(100);
  expected.next(100);
  assert.deepEqual(lines(pintr), lines(expected));
});

test('checkpoint corruption is rejected', () => {
  const image = preparePintrImage(rgbaFixture());
  const pintr = createPintr({ image, config: CONFIG, seed: 5 });
  pintr.next(20);
  const checkpoint = pintr.save();
  checkpoint[checkpoint.length - 1] ^= 0xff;

  assert.throws(() => restorePintr(checkpoint), /PINTR: invalid checkpoint/);
});

test('optional image utilities do not mutate their input', () => {
  const image = rgbaFixture(20, 10);
  const before = new Uint8ClampedArray(image.rgba);
  const resized = resizeRgbaImage(image, {
    longestSide: 40,
    allowUpscale: true,
  });
  const vignette = applyVignette(image, {
    vignetteDistance: 50,
    vignetteHardness: 50,
    vignetteSquare: false,
  });

  assert.deepEqual(image.rgba, before);
  assert.equal(resized.width, 40);
  assert.equal(resized.height, 20);
  assert.notStrictEqual(vignette.rgba, image.rgba);
});

function isWhite(image: { width: number; rgba: ArrayLike<number> }, x: number, y: number) {
  const i = (y * image.width + x) * 4;
  return (
    image.rgba[i] === 255 &&
    image.rgba[i + 1] === 255 &&
    image.rgba[i + 2] === 255 &&
    image.rgba[i + 3] === 255
  );
}

test('framing gives the canvas exactly the requested aspect ratio', () => {
  const landscape = rgbaFixture(80, 40);
  const portrait = rgbaFixture(40, 80);

  const wide = frameRgbaImage(landscape, { aspectRatio: 16 / 9, padding: 0 });
  assert.deepEqual([wide.width, wide.height], [80, 45]);

  const tall = frameRgbaImage(landscape, { aspectRatio: 9 / 16, padding: 0 });
  assert.deepEqual([tall.width, tall.height], [45, 80]);

  const square = frameRgbaImage(portrait, { aspectRatio: 1, padding: 0 });
  assert.deepEqual([square.width, square.height], [80, 80]);
});

test('framing with default options keeps the source dimensions', () => {
  const image = rgbaFixture(80, 40);
  const framed = frameRgbaImage(image, { aspectRatio: null, padding: 0 });

  assert.deepEqual([framed.width, framed.height], [80, 40]);
});

test('padding insets the picture without changing the canvas', () => {
  const image = rgbaFixture(40, 40);
  const framed = frameRgbaImage(image, { aspectRatio: 1, padding: 10 });
  const pad = 4; // 10% of the 40px short side

  assert.deepEqual([framed.width, framed.height], [40, 40]);
  // The whole border is opaque white, and the centre is not.
  for (let x = 0; x < framed.width; x++) {
    assert.ok(isWhite(framed, x, pad - 1), `top border at ${x}`);
    assert.ok(isWhite(framed, x, framed.height - pad), `bottom border at ${x}`);
  }
  for (let y = 0; y < framed.height; y++) {
    assert.ok(isWhite(framed, pad - 1, y), `left border at ${y}`);
    assert.ok(isWhite(framed, framed.width - pad, y), `right border at ${y}`);
  }
  assert.ok(!isWhite(framed, 20, 20));
});

test('framing does not mutate its input', () => {
  const image = rgbaFixture(20, 10);
  const before = new Uint8ClampedArray(image.rgba);

  frameRgbaImage(image, { aspectRatio: 1, padding: 12 });

  assert.deepEqual(image.rgba, before);
});

test('framing a vignetted image leaves the vignette keyed to the picture', () => {
  // A landscape source in a square frame: the picture keeps its own size and is
  // letterboxed, so the vignette must stay exactly what it was on the source —
  // its centre, its radius, and (for the square mode) the short side it is
  // scaled against all belong to the picture, never to the canvas.
  const source = rgbaFixture(60, 40);
  const vignetted = applyVignette(source, {
    vignetteDistance: 50,
    vignetteHardness: 50,
    vignetteSquare: true,
  });
  const framed = frameRgbaImage(vignetted, { aspectRatio: 1, padding: 0 });

  assert.deepEqual([framed.width, framed.height], [60, 60]);

  const offsetY = 10;
  for (let y = 0; y < framed.height; y++) {
    for (let x = 0; x < framed.width; x++) {
      const inPicture = y >= offsetY && y < offsetY + vignetted.height;

      if (!inPicture) {
        assert.ok(isWhite(framed, x, y), `letterbox at ${x},${y}`);
        continue;
      }

      const target = (y * framed.width + x) * 4;
      const picture = ((y - offsetY) * vignetted.width + x) * 4;
      assert.deepEqual(
        [
          framed.rgba[target],
          framed.rgba[target + 1],
          framed.rgba[target + 2],
        ],
        [
          vignetted.rgba[picture],
          vignetted.rgba[picture + 1],
          vignetted.rgba[picture + 2],
        ],
        `picture at ${x},${y}`
      );
    }
  }
});

// rgbaFixture is deliberately high frequency: it wraps at 256 every few pixels,
// so no blur of it stays near the pixel it started from. The extension is a blur,
// which needs a source that is actually smooth to make claims about.
function gradientFixture(width: number, height: number) {
  const rgba = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      rgba[i] = Math.round((x / (width - 1)) * 200) + 20;
      rgba[i + 1] = Math.round((y / (height - 1)) * 200) + 20;
      rgba[i + 2] = 128;
      rgba[i + 3] = 255;
    }
  }

  return { width, height, rgba };
}

test('extend fills the frame with a blurred continuation of the picture', () => {
  const source = gradientFixture(60, 40);
  const framed = frameRgbaImage(source, {
    aspectRatio: 1,
    padding: 0,
    extend: true,
  });
  const offsetY = 10;

  assert.deepEqual([framed.width, framed.height], [60, 60]);

  // Nothing is left white for PINTR to read as empty.
  for (let y = 0; y < framed.height; y++) {
    for (let x = 0; x < framed.width; x++) {
      assert.ok(!isWhite(framed, x, y), `fill at ${x},${y}`);
    }
  }

  // The picture is copied through byte for byte: the extension only ever writes
  // outside it.
  for (let y = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {
      const target = ((y + offsetY) * framed.width + x) * 4;
      const original = (y * source.width + x) * 4;
      assert.deepEqual(
        Array.from(framed.rgba.slice(target, target + 4)),
        Array.from(source.rgba.slice(original, original + 4)),
        `picture at ${x},${y}`
      );
    }
  }

  // The row against the picture is one pixel from it, so it is a one-pixel
  // average: continuous with the edge, but pulled toward the picture's interior
  // rather than a copy of the edge the way plain replication would be.
  for (let x = 0; x < framed.width; x++) {
    const seam = ((offsetY - 1) * framed.width + x) * 4;
    const edge = (0 * source.width + x) * 4;

    assert.ok(
      Math.abs(framed.rgba[seam] - source.rgba[edge]) <= 6,
      `seam continuity at ${x}`
    );
    assert.ok(
      framed.rgba[seam + 1] > source.rgba[edge + 1],
      `seam averages inward at ${x}`
    );
  }
});

test('extending weights the picture pixels nearest the point it fills', () => {
  // A tall gradient extended straight up. Every box is centred on the same top
  // edge pixel, so the only thing separating a weighted average from a flat one
  // is how much say the rows far down the picture get.
  const picture = gradientFixture(40, 200);
  const distance = 100;
  const extended = extendRgbaImage(picture, {
    canvasWidth: picture.width,
    canvasHeight: picture.height + distance,
    offsetX: 0,
    offsetY: distance,
  });

  const x = 20;
  const green = (
    image: { width: number; rgba: ArrayLike<number> },
    px: number,
    py: number
  ) => image.rgba[(py * image.width + px) * 4 + 1];

  // The flat average over the same window: every pixel from the edge out to the
  // full radius, counted once.
  let total = 0;
  let count = 0;
  for (let y = 0; y <= distance; y++) {
    for (let cx = Math.max(0, x - distance); cx <= Math.min(picture.width - 1, x + distance); cx++) {
      total += green(picture, cx, y);
      count += 1;
    }
  }
  const flat = total / count;

  const filled = green(extended, x, 0);
  const edge = green(picture, x, 0);

  // It is pulled off the edge value — it is still an average — but it lands well
  // short of the flat one, because the near rows outvote the far ones.
  assert.ok(filled > edge, `${filled} should be pulled in from the edge ${edge}`);
  assert.ok(filled < flat - 20, `${filled} should stay well under the flat ${flat}`);
});

test('extending converges on the picture average far away from it', () => {
  // Out here even the narrowest of the nested boxes is wider than the picture,
  // so every one of them covers all of it and the weighting has nothing left to
  // favour: the fill settles on the picture's overall tone.
  const picture = gradientFixture(8, 8);
  const extended = extendRgbaImage(picture, {
    canvasWidth: 200,
    canvasHeight: 200,
    offsetX: 96,
    offsetY: 96,
  });

  const mean = [0, 0, 0, 0];
  for (let i = 0; i < picture.rgba.length; i += 4) {
    for (let channel = 0; channel < 4; channel++) {
      mean[channel] += picture.rgba[i + channel];
    }
  }
  const count = picture.width * picture.height;

  for (const [x, y] of [
    [0, 0],
    [199, 0],
    [0, 199],
    [199, 199],
  ]) {
    const corner = (y * extended.width + x) * 4;
    for (let channel = 0; channel < 4; channel++) {
      assert.ok(
        Math.abs(extended.rgba[corner + channel] - mean[channel] / count) <= 1,
        `corner ${x},${y} channel ${channel}`
      );
    }
  }
});

test('extending is deterministic and does not mutate its input', () => {
  const picture = gradientFixture(30, 20);
  const before = new Uint8ClampedArray(picture.rgba);
  const options = {
    canvasWidth: 60,
    canvasHeight: 60,
    offsetX: 15,
    offsetY: 20,
  };

  const first = extendRgbaImage(picture, options);
  const second = extendRgbaImage(picture, options);

  assert.deepEqual(picture.rgba, before);
  assert.deepEqual(first.rgba, second.rgba);
});

const SOURCE: SourceConfig = {
  aspectRatio: '1:1',
  padding: 0,
  extend: false,
  vignette: true,
  vignetteDistance: 50,
  vignetteHardness: 50,
  vignetteSquare: true,
};

const VIGNETTE = {
  vignetteDistance: SOURCE.vignetteDistance,
  vignetteHardness: SOURCE.vignetteHardness,
  vignetteSquare: SOURCE.vignetteSquare,
};

test('without extend the vignette is applied under the frame', () => {
  const source = rgbaFixture(60, 40);
  const processed = processSourceImage(source, SOURCE);
  const expected = frameRgbaImage(applyVignette(source, VIGNETTE), {
    aspectRatio: 1,
    padding: 0,
  });

  assert.deepEqual(processed.rgba, expected.rgba);
  // The frame is pure white margin the vignette never reached.
  assert.ok(isWhite(processed, 30, 0));
});

test('with extend the vignette is applied on top of the extended frame', () => {
  const source = rgbaFixture(60, 40);
  const processed = processSourceImage(source, { ...SOURCE, extend: true });
  const expected = applyVignette(
    frameRgbaImage(source, { aspectRatio: 1, padding: 0, extend: true }),
    VIGNETTE
  );

  assert.deepEqual(processed.rgba, expected.rgba);

  // The vignette now reaches into the corners the extend filled in: they are
  // faded well toward white, while the centre is left alone.
  const plain = frameRgbaImage(source, {
    aspectRatio: 1,
    padding: 0,
    extend: true,
  });
  const red = (image: typeof plain, x: number, y: number) =>
    image.rgba[(y * image.width + x) * 4];

  assert.ok(red(processed, 0, 0) > red(plain, 0, 0) + 100, 'corner faded');
  assert.equal(red(processed, 30, 30), red(plain, 30, 30), 'centre untouched');
});
