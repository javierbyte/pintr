export function clamp(val, start, end) {
  const min = Math.min(start, end);
  const max = Math.max(start, end);

  return Math.min(Math.max(val, min), max);
}

export function intRnd(start, end) {
  if (end === undefined) {
    return Math.floor(Math.random() * start);
  }

  return (
    Math.min(start, end) + Math.floor(Math.random() * Math.abs(start - end))
  );
}

export function debounce(fn, wait) {
  let timeout;
  return function () {
    clearTimeout(timeout);
    let args = arguments;
    timeout = setTimeout(function () {
      fn.apply(this, args);
    }, wait || 1);
  };
}
