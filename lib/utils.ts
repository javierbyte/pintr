export function clamp(val: number, start: number, end: number) {
  const min = Math.min(start, end);
  const max = Math.max(start, end);

  return Math.min(Math.max(val, min), max);
}

export function intRnd(start: number, end?: number) {
  if (end === undefined) {
    return Math.floor(Math.random() * start);
  }

  return (
    Math.min(start, end) + Math.floor(Math.random() * Math.abs(start - end))
  );
}

export function debounce<F extends (...params: any[]) => void>(
  fn: F,
  delay: number
) {
  let timeoutID: number = 0;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutID);
    timeoutID = window.setTimeout(() => fn.apply(this, args), delay);
  } as F;
}

export function tweenValue(value: number, tweens: [number, number][]): number {
  const sortedTweens = [...tweens];
  sortedTweens.sort((a, b) => a[0] - b[0]);

  if (
    value < sortedTweens[0][0] ||
    value > sortedTweens[sortedTweens.length - 1][0]
  ) {
    console.error(`Value "${value}" out of range`, {
      value,
      tweens,
      sortedTweens,
    });
    return value;
  }

  for (const tweenIdx in tweens) {
    const tween = tweens[tweenIdx];

    if (tween[0] === value) {
      return tween[1];
    }

    // the value is between this tween and the previous one
    if (tween[0] > value) {
      const previousTween = tweens[Number(tweenIdx) - 1];

      const range = tween[0] - previousTween[0];
      const progress = (value - previousTween[0]) / range;

      return progress * tween[1] + (1 - progress) * previousTween[1];
    }
  }

  return value;
}
