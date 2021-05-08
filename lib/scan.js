const PREC = 1024;

export function scanLine(from, to, matrix, bg) {
  let r = 0;
  let g = 0;
  let b = 0;

  const x = from[0];
  const lengthX = to[0] - from[0];

  const y = from[1];
  const lengthY = to[1] - from[1];

  for (let i = 0; i < PREC; i++) {
    const scanX = Math.round(x + (lengthX / PREC) * i);
    const scanY = Math.round(y + (lengthY / PREC) * i);

    const target = matrix[scanX][scanY];

    r += target.r;
    g += target.g;
    b += target.b;
  }

  if (bg) {
    return (r + g + b) / (255 * 3 * PREC);
  }
  return [Math.round(r / PREC), Math.round(g / PREC), Math.round(b / PREC)];
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

  // console.log(PREC, precision);

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
