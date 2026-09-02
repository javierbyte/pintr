const STEP = 0x6d2b79f5;

export type PintrRandom = ReturnType<typeof createRandom>;

// PINTR only needs one uint32 of random state. The call sites stay in the same
// order as Math.random did, while checkpoints can now continue the sequence.
export function createRandom(seed: number, restoredState?: number) {
  let state = (restoredState === undefined ? seed : restoredState) >>> 0;

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

  return {
    next,
    int,
    get state() {
      return state;
    },
  };
}
