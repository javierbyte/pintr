export function clamp(value: number, start: number, end: number) {
  const min = Math.min(start, end);
  const max = Math.max(start, end);
  return Math.min(Math.max(value, min), max);
}

// ImageData writes use ToUint8Clamp rather than Uint8Array's modulo behavior.
// Keeping it explicit makes browser and CLI byte buffers prepare identically.
export function toUint8Clamp(value: number) {
  if (Number.isNaN(value) || value <= 0) return 0;
  if (value >= 255) return 255;

  const floor = Math.floor(value);
  const fraction = value - floor;
  if (fraction > 0.5) return floor + 1;
  if (fraction < 0.5) return floor;
  return floor % 2 ? floor + 1 : floor;
}
