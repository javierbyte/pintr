# PINTR core

```ts
import { createPintr } from './lib/pintr-core';
import { preparePintrImage } from './lib/pintr-core/utils';

const image = preparePintrImage({ width, height, rgba });
const pintr = createPintr({
  image,
  config: {
    contrast: 50,
    definition: 50,
    singleLine: true,
    strokeWidth: 1.5,
  },
  seed: 1234,
});

const first = pintr.next(128);
draw(first.lines);

// Nothing runs between calls. Calling next() continues at line 128.
const second = pintr.next(128);
draw(second.lines);
```

The implementation is a local module for now; no package is created by this
extraction. A future package can expose the same two entry points as
`pintr-core` and `pintr-core/utils` without changing the API.

## Core API

The core receives prepared grayscale pixels and returns coordinates. It has no
DOM, Canvas, decoder, renderer, timer, or platform dependency.

```ts
createPintr({ image, config, seed? }): PintrSession;

session.next(count): PintrBatch;
```

`next(count)` synchronously generates exactly that many lines. The session is
naturally paused as soon as the call returns; call it again whenever the host is
ready. Its working image, cursor, and random generator stay warm between calls,
and batch boundaries do not affect the generated coordinates.

The core only returns new lines. A host that needs the complete drawing owns
that list and appends each batch to it. This keeps generation state small and
lets a browser draw lines immediately without storing them twice.

The input image is:

```ts
type PintrImage = {
  width: number;
  height: number;
  // Column-major: gray[x * height + y], where 0 is black and 255 is white.
  gray: Uint8Array;
};
```

PINTR copies the working pixels, so a prepared image can be reused to create
independent sessions. Supplying a uint32 `seed` makes a run reproducible.

## Host scheduling

A browser or React Native host should request small batches from its own frame
loop:

```ts
function frame() {
  const remaining = targetLineCount - pintr.lineCount;
  if (remaining <= 0) return;

  draw(pintr.next(Math.min(32, remaining)).lines);
  requestAnimationFrame(frame);
}
```

A CLI can use larger batches or generate its whole target in one call:

```ts
const lines = [];

while (pintr.lineCount < targetLineCount) {
  const batch = pintr.next(
    Math.min(1000, targetLineCount - pintr.lineCount)
  );
  lines.push(...batch.lines);
}

writeCoordinates(lines);
```

## Optional image utilities

`./lib/pintr-core/utils` contains pure, non-mutating helpers that are not needed
by the generator itself:

```ts
preparePintrImage(rgbaImage): PintrImage;
resizeRgbaImage(rgbaImage, { longestSide, allowUpscale? }): RgbaImage;
applyVignette(rgbaImage, options): RgbaImage;
frameRgbaImage(rgbaImage, { aspectRatio, padding, extend? }): RgbaImage;
extendRgbaImage(rgbaImage, { canvasWidth, canvasHeight, offsetX, offsetY }): RgbaImage;
```

`frameRgbaImage` places the image, contained, on an opaque white canvas of the
requested aspect ratio (`width / height`, or `null` to keep the source's).
`padding` is a percentage of the canvas short side and insets the picture within
that canvas, so the requested ratio always decides the output dimensions. With
`extend`, the space around the picture is filled by `extendRgbaImage` instead of
staying white.

`extendRgbaImage` continues a picture outward over the canvas around it. Each
pixel outside averages the picture pixels within its own distance of the nearest
picture pixel, weighted so the nearest ones count for most. The fill leaves the
edge sharp, grows blurrier the further it travels, and settles on the picture's
overall tone far away from it — a diffusion outward rather than the edge pixel
smearing. The weight comes from averaging four nested boxes, each half the radius
of the one before, which counts the near pixels repeatedly; boxes rather than
discs let a summed-area table answer any radius in constant time, so the pass
stays linear in the canvas.

`RgbaImage.rgba` is row-major, unpremultiplied RGBA in a `Uint8Array` or
`Uint8ClampedArray`. Image decoding remains the host's responsibility: Canvas
in a browser, the application's native image library in React Native, or a Node
image library in a CLI.
