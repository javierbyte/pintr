export function scanLine(from, to, matrix, bg) {
  let r = 0;
  let g = 0;
  let b = 0;

  const x = from[0];
  const lengthX = to[0] - from[0];

  const y = from[1];
  const lengthY = to[1] - from[1];

  const precision = Math.max(Math.abs(lengthX), Math.abs(lengthY));

  for (let i = 0; i < precision; i++) {
    const scanX = Math.round(x + (lengthX / precision) * i);
    const scanY = Math.round(y + (lengthY / precision) * i);

    const target = matrix[scanX][scanY];

    r += target.r;
    g += target.g;
    b += target.b;
  }

  if (bg) {
    return (r + g + b) / (255 * 3 * precision);
  }
  return [Math.round(r / precision), Math.round(g / precision), Math.round(b / precision)];
}

export function weightedScan(from, to, matrix, bg) {
  let r = 0;
  let g = 0;
  let b = 0;

  const x = from[0];
  const lengthX = to[0] - from[0];

  const y = from[1];
  const lengthY = to[1] - from[1];

  let weight = 1;

  const precision = Math.max(Math.abs(lengthX), Math.abs(lengthY));

  for (let i = 0; i < precision; i++) {
    const scanX = Math.round(x + (lengthX / precision) * i);
    const scanY = Math.round(y + (lengthY / precision) * i);

    const target = matrix[scanX][scanY];

    const currentWeight = i / precision + 1;

    weight += currentWeight;

    r += target.r + currentWeight;
    g += target.g + currentWeight;
    b += target.b + currentWeight;
  }

  if (bg) {
    return (r + g + b) / (255 * 3 * weight);
  }
  return [
    Math.round(r / weight),
    Math.round(g / weight),
    Math.round(b / weight),
  ];
}
