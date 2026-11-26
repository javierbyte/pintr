# PINTR core: canonical implementation

This directory in the original PINTR repository (`~/Projects/pintr/pintr`) is
PINTR's source of truth and reference implementation. Algorithm changes belong
here first. The Apple app implements the same algorithm in Swift; its copied
TypeScript files are reference fixtures, not another engine to evolve separately.

## Three separate responsibilities

| Layer | Owns | Does not own |
| --- | --- | --- |
| App / source preparation | Decode, orientation, resizing, crop policy, grayscale and alpha conversion, framing, padding, extension, vignette | Line selection |
| PINTR core | Prepared grayscale image, configuration, seed, working-image feedback, cursor, random state, count; produce more coordinates on demand | Decoding, UI, rendering, animation, export, complete drawing archive |
| Rendering / presentation | Store emitted coordinates, display any prefix, stroke style, incremental rasterization, reveal pacing, export | Choosing new coordinates or modifying generation state |

Grayscale conversion is an app decision, even though its helper returns the
core's input type. Nothing in core requires a particular decoder, resize size,
crop, grayscale weighting, or vignette. Web and iOS can use their native image
libraries. For identical coordinates they must supply identical prepared pixels,
configuration, and seed.

The `utils/` directory is a convenient collection of pure **app-side image
helpers**, not part of the generation algorithm. Its location does not transfer
image preparation responsibilities to PINTR core. `index.ts` and `utils/index.ts`
are separate entry points. The core imports none of those image helpers.

## What core does

PINTR searches for straight lines that follow the darker parts of an image.
It starts at the image centre. For each line it samples possible destinations,
scores the average grayscale value along each candidate, and chooses a dark
route. In continuous mode the next line begins at the previous endpoint. In
independent-line mode it also samples darker starting positions.

Periodically it lightens the working pixels covered by recent lines. This
feedback makes subsequent searches explore areas that still need ink. The
feedback uses deterministic 4×4 subpixel coverage and unions overlapping strokes
within each feedback batch. This internal coverage calculation is numerical
algorithm state, **not artwork rendering**; core never produces a bitmap to show.

- `definition` (0–100) controls search effort and feedback cadence.
- `contrast` (0–100) controls how strongly drawn areas are lightened.
- `singleLine` selects continuous or independent segments.
- `strokeWidth` (positive) affects feedback coverage, so changing it changes
  future coordinates. A renderer may separately choose a display width, but the
  usual app setting applies to both generation and rendering.
- `seed` (uint32, optional) determines the random sequence. Pass one to make a
  drawing reproducible; omitting it picks one at random.

No target line count or maximum drawing length belongs to core. The app decides
how much to request, retain, show, or export. Changing image/configuration/seed
requires a new session; changing the visible count does not.

## Input and streaming API

```ts
import { createPintr } from './lib/pintr-core';

const session = createPintr({
  image: { width, height, gray },
  config: { contrast: 50, definition: 50, singleLine: true, strokeWidth: 1.5 },
  seed: 1234,
});
const line = session.next(); // [[fromX, fromY], [toX, toY]]
const another = session.next(); // continues the same drawing; does not replay
```

`gray` is a `Uint8Array`, column-major (`gray[x * height + y]`), with
0 = black and 255 = white, holding exactly width × height entries. The working
image is copied, so the caller can reuse its prepared input. Inputs are not
validated: the caller is trusted to pass a `definition` and `contrast` from 0 to
100 and a positive `strokeWidth`.

`next()` synchronously returns one new line. Returned lines are not retained as
a complete history inside core. It retains only the working image, pending
feedback lines, cursor, random state, and count needed to continue.

Nothing runs between calls, and how the calls are grouped does not change the
coordinates. There is no renderer, DOM, Canvas, timer, worker, or platform
dependency. Pause means stop calling `next`; resume means call it again.
Discarding a session ends that run.

## Host and renderer contract

The app stores returned batches once, in order. It tracks **generated**, **target**,
and **visible** counts separately. Lowering the visible count draws a prefix of
the stored coordinates immediately; it must not restart core or throw away its
warm state. Raising it first reveals available coordinates, then requests more
if necessary. A small look-ahead buffer can hide generation latency.

The host owns scheduling: small batches under a frame-time budget in a browser,
a background task/actor on iOS, or larger synchronous batches in a CLI. The host chooses how
many lines to ask for per frame and checks cancellation between calls. It must reject stale batches
when image/configuration changes replace a session.

Rendering can animate the reveal while generation continues, cache raster
prefixes to show fewer lines quickly, or replace an old drawing progressively.
These are presentation policies: they must preserve stored straight-line
coordinates and must not change the seed, feedback, or generation cursor.
Screen and exports should use the same geometry.

## App-side helpers and current web behavior

`utils/` provides non-mutating operations on row-major, straight (unpremultiplied)
RGBA byte arrays:

- `preparePintrImage`: weighted grayscale (R .399, G .537, B .064), normalization,
  alpha compositing onto white, and conversion to core's column-major layout.
  The historical normalization treats alpha < 128 as white for extrema but uses
  RGB for normalization before final alpha compositing. This is reference
  behavior, not a grayscale rule imposed by core.
- `resizeRgbaImage`: area averaging for reduction; optional bilinear enlargement.
- `frameRgbaImage`: contain without cropping or stretching, preserve or select
  aspect ratio, inset padding as a percentage of the canvas short side (0 ≤ p < 50).
  The output longest side stays fixed; padding shrinks the picture within it.
- `extendRgbaImage`: fill surrounding space using four nested distance-weighted
  box averages, interpolated between radii. Summed-area tables keep this linear
  in the canvas size. Original picture pixels are copied unchanged.
- `applyVignette`: fade RGB toward white with distance, hardness, and square versus
  source-aspect geometry; alpha is preserved.

The web app (`lib/preprocess.ts`) decodes its source at 1080 px on the longest
side. Without extension it applies vignette to the picture before framing; with
extension it frames/extends first and applies vignette to the whole canvas.
The app offers original/common/paper ratios, padding, extension, and vignette,
alongside the four core settings.

## Known boundaries and deviations

The original web core follows the three-layer contract. Its browser adapter
(`lib/PINTR.ts`) combines host scheduling and immediate Canvas drawing, which is
app code rather than core. It also stores the emitted coordinates, so lowering
the line count with `setLineCount` repaints a prefix of them.

Source decoding/resampling and stroke rasterizers differ by platform; compare
prepared bytes and coordinates for algorithm parity, not PNG bytes.
