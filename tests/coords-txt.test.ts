import assert from 'node:assert/strict';
import test from 'node:test';

import {
  coordsFileName,
  generateCoordsTxt,
  segmentsToPaths,
} from '../lib/coords-txt';
import type { Coord } from '../lib/PINTR';

const SIZE: [number, number] = [1080, 1350];

// A chain, as single-line mode emits it: each segment starts where the last ended.
function chain(points: Coord[]): [Coord, Coord][] {
  const segments: [Coord, Coord][] = [];
  for (let i = 1; i < points.length; i++) {
    segments.push([points[i - 1], points[i]]);
  }
  return segments;
}

test('a chained segment list collapses to one path keeping every point', () => {
  const points: Coord[] = [
    [0, 0],
    [10, 20],
    [30, 40],
    [50, 60],
  ];

  const paths = segmentsToPaths(chain(points));

  assert.equal(paths.length, 1);
  assert.equal(paths[0].length, points.length);
  assert.deepEqual(paths[0], points);
});

test('a disjoint segment list yields one two-point path per segment', () => {
  const segments: [Coord, Coord][] = [
    [
      [0, 0],
      [1, 1],
    ],
    [
      [10, 10],
      [11, 11],
    ],
    [
      [20, 20],
      [21, 21],
    ],
  ];

  const paths = segmentsToPaths(segments);

  assert.equal(paths.length, segments.length);
  for (const path of paths) assert.equal(path.length, 2);
  assert.deepEqual(paths, segments);
});

test('a mixed list splits at exactly the discontinuities', () => {
  const segments: [Coord, Coord][] = [
    ...chain([
      [0, 0],
      [1, 1],
      [2, 2],
    ]),
    // Jump: starts somewhere other than [2, 2].
    ...chain([
      [50, 50],
      [51, 51],
    ]),
    // Continues from [51, 51], so it stays in the same path.
    [
      [51, 51],
      [52, 52],
    ],
  ];

  assert.deepEqual(segmentsToPaths(segments), [
    [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
    [
      [50, 50],
      [51, 51],
      [52, 52],
    ],
  ]);
});

test('paths are separated by a blank line and rows are bare coordinates', () => {
  const segments: [Coord, Coord][] = [
    ...chain([
      [0, 0],
      [1, 1],
      [2, 2],
    ]),
    [
      [900, 900],
      [901, 901],
    ],
  ];

  const txt = generateCoordsTxt(segments);

  assert.equal(txt, '0,0\n1,1\n2,2\n\n900,900\n901,901\n');
  // Nothing but coordinates: no comments, no header, no stray columns.
  for (const row of txt.trim().split('\n')) {
    if (row === '') continue;
    assert.match(row, /^\d+,\d+$/);
  }
});

test('empty input produces an empty file', () => {
  assert.equal(generateCoordsTxt([]), '');
});

test('the filename carries the pixel space the coordinates are in', () => {
  assert.equal(coordsFileName(SIZE), 'PINTR-1080x1350.txt');
  assert.equal(coordsFileName([800, 800]), 'PINTR-800x800.txt');
});

test('every emitted row parses back to the original coordinates', () => {
  const points: Coord[] = [];
  for (let i = 0; i < 50; i++) {
    points.push([(i * 37) % SIZE[0], (i * 53) % SIZE[1]]);
  }

  const parsed = generateCoordsTxt(chain(points))
    .trim()
    .split('\n')
    .map((row) => row.split(',').map(Number) as Coord);

  assert.deepEqual(parsed, points);
});
