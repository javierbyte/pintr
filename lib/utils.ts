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

export function debounce(fn: () => void, wait: number) {
  let timeout: number;
  return function () {
    clearTimeout(timeout);
    let args = arguments;
    timeout = setTimeout(function () {
      fn.apply(this, args);
    }, wait || 1);
  };
}
