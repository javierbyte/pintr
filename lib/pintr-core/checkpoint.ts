import type { PintrConfig, PintrLine, PintrPoint } from './types';
import { PintrError } from './types';

const MAGIC = [80, 73, 78, 84, 82, 67, 80, 49] as const; // PINTRCP1
const HEADER_SIZE = 20;
const PAYLOAD_HEADER_SIZE = 64;
const FORMAT_VERSION = 1;
const ALGORITHM_VERSION = 1;
const BYTES_PER_LINE = 16;
const MAX_PIXELS = 100_000_000;

export type CheckpointState = {
  width: number;
  height: number;
  config: PintrConfig;
  seed: number;
  randomState: number;
  cursor: PintrPoint;
  gray: Uint8Array;
  lines: PintrLine[];
  pendingCount: number;
};

function checksum(bytes: Uint8Array, start: number) {
  let hash = 0x811c9dc5;
  for (let i = start; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function fail(message: string): never {
  throw new PintrError(`invalid checkpoint: ${message}`);
}

export function encodeCheckpoint(state: CheckpointState) {
  const totalLength =
    HEADER_SIZE +
    PAYLOAD_HEADER_SIZE +
    state.gray.length +
    state.lines.length * BYTES_PER_LINE;
  const bytes = new Uint8Array(totalLength);
  const view = new DataView(bytes.buffer);

  for (let i = 0; i < MAGIC.length; i++) bytes[i] = MAGIC[i];
  view.setUint16(8, FORMAT_VERSION, true);
  view.setUint16(10, ALGORITHM_VERSION, true);
  view.setUint32(12, totalLength, true);

  let offset = HEADER_SIZE;
  view.setUint32(offset, state.width, true);
  offset += 4;
  view.setUint32(offset, state.height, true);
  offset += 4;
  view.setFloat64(offset, state.config.contrast, true);
  offset += 8;
  view.setFloat64(offset, state.config.definition, true);
  offset += 8;
  view.setFloat64(offset, state.config.strokeWidth, true);
  offset += 8;
  view.setUint8(offset, state.config.singleLine ? 1 : 0);
  offset += 4; // one boolean plus three reserved bytes
  view.setUint32(offset, state.seed, true);
  offset += 4;
  view.setUint32(offset, state.randomState, true);
  offset += 4;
  view.setUint32(offset, state.cursor[0], true);
  offset += 4;
  view.setUint32(offset, state.cursor[1], true);
  offset += 4;
  view.setUint32(offset, state.lines.length, true);
  offset += 4;
  view.setUint32(offset, state.pendingCount, true);
  offset += 4;
  view.setUint32(offset, state.gray.length, true);
  offset += 4;

  bytes.set(state.gray, offset);
  offset += state.gray.length;

  for (const line of state.lines) {
    view.setUint32(offset, line[0][0], true);
    view.setUint32(offset + 4, line[0][1], true);
    view.setUint32(offset + 8, line[1][0], true);
    view.setUint32(offset + 12, line[1][1], true);
    offset += BYTES_PER_LINE;
  }

  view.setUint32(16, checksum(bytes, HEADER_SIZE), true);
  return bytes;
}

export function decodeCheckpoint(input: Uint8Array): CheckpointState {
  const bytes = new Uint8Array(input);
  if (bytes.length < HEADER_SIZE + PAYLOAD_HEADER_SIZE) fail('truncated header');

  for (let i = 0; i < MAGIC.length; i++) {
    if (bytes[i] !== MAGIC[i]) fail('wrong magic header');
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint16(8, true) !== FORMAT_VERSION) {
    fail('unsupported format version');
  }
  if (view.getUint16(10, true) !== ALGORITHM_VERSION) {
    fail('unsupported algorithm version');
  }
  if (view.getUint32(12, true) !== bytes.length) fail('wrong byte length');
  if (view.getUint32(16, true) !== checksum(bytes, HEADER_SIZE)) {
    fail('checksum mismatch');
  }

  let offset = HEADER_SIZE;
  const width = view.getUint32(offset, true);
  offset += 4;
  const height = view.getUint32(offset, true);
  offset += 4;
  const contrast = view.getFloat64(offset, true);
  offset += 8;
  const definition = view.getFloat64(offset, true);
  offset += 8;
  const strokeWidth = view.getFloat64(offset, true);
  offset += 8;
  const singleLineByte = view.getUint8(offset);
  offset += 4;
  const seed = view.getUint32(offset, true);
  offset += 4;
  const randomState = view.getUint32(offset, true);
  offset += 4;
  const cursorX = view.getUint32(offset, true);
  offset += 4;
  const cursorY = view.getUint32(offset, true);
  offset += 4;
  const lineCount = view.getUint32(offset, true);
  offset += 4;
  const pendingCount = view.getUint32(offset, true);
  offset += 4;
  const grayLength = view.getUint32(offset, true);
  offset += 4;

  if (!width || !height || width * height > MAX_PIXELS) {
    fail('invalid image dimensions');
  }
  if (grayLength !== width * height) fail('wrong grayscale length');
  if (singleLineByte > 1) fail('invalid singleLine value');
  if (pendingCount > lineCount) fail('pending lines exceed line count');
  if (cursorX >= width || cursorY >= height) fail('cursor is outside the image');

  const expectedLength =
    HEADER_SIZE +
    PAYLOAD_HEADER_SIZE +
    grayLength +
    lineCount * BYTES_PER_LINE;
  if (expectedLength !== bytes.length) fail('inconsistent payload lengths');

  const gray = bytes.slice(offset, offset + grayLength);
  offset += grayLength;
  const lines: PintrLine[] = [];

  for (let i = 0; i < lineCount; i++) {
    const fromX = view.getUint32(offset, true);
    const fromY = view.getUint32(offset + 4, true);
    const toX = view.getUint32(offset + 8, true);
    const toY = view.getUint32(offset + 12, true);
    offset += BYTES_PER_LINE;

    if (fromX >= width || toX >= width || fromY >= height || toY >= height) {
      fail('line coordinate is outside the image');
    }

    lines.push([
      [fromX, fromY],
      [toX, toY],
    ]);
  }

  return {
    width,
    height,
    config: { contrast, definition, singleLine: Boolean(singleLineByte), strokeWidth },
    seed,
    randomState,
    cursor: [cursorX, cursorY],
    gray,
    lines,
    pendingCount,
  };
}
