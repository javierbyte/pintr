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

// Like debounce, but fires at most once per `interval` *while* events keep
// arriving — debounce postpones forever during a continuous drag and only runs
// once you pause/release. Leading + trailing edge so the first and final values
// always land.
export function throttle<F extends (...params: any[]) => void>(
  fn: F,
  interval: number
) {
  let lastRun = 0;
  let timeoutID: number = 0;
  return function (this: any, ...args: any[]) {
    const remaining = interval - (Date.now() - lastRun);
    if (remaining <= 0) {
      clearTimeout(timeoutID);
      timeoutID = 0;
      lastRun = Date.now();
      fn.apply(this, args);
    } else if (!timeoutID) {
      timeoutID = window.setTimeout(() => {
        lastRun = Date.now();
        timeoutID = 0;
        fn.apply(this, args);
      }, remaining);
    }
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

  for (let i = 0; i < tweens.length; i++) {
    const tween = tweens[i];

    if (tween[0] === value) {
      return tween[1];
    }

    // the value is between this tween and the previous one
    if (tween[0] > value) {
      const previousTween = tweens[i - 1];

      const range = tween[0] - previousTween[0];
      const progress = (value - previousTween[0]) / range;

      return progress * tween[1] + (1 - progress) * previousTween[1];
    }
  }

  return value;
}
