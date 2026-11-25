export function clamp(val: number, start: number, end: number) {
  const min = Math.min(start, end);
  const max = Math.max(start, end);

  return Math.min(Math.max(val, min), max);
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

// Like debounce, but it keeps firing (at most once per `interval`) while the
// events keep arriving, instead of waiting for them to stop.
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
