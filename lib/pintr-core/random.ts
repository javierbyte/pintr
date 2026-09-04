const STEP = 0x6d2b79f5;

// A seed makes a drawing reproducible without changing how the generator asks
// for random integers.
export function createRandom(seed: number) {
  let state = seed >>> 0;

  function next() {
    state = (state + STEP) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  function int(start: number, end?: number) {
    if (end === undefined) return Math.floor(next() * start);

    return (
      Math.min(start, end) + Math.floor(next() * Math.abs(start - end))
    );
  }

  return { int };
}
