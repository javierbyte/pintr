import type { Coord } from './PINTR';

import { generateSmoothSvg } from './smooth-svg';

function backgroundRect(size: [number, number], whiteBackground?: boolean) {
  return whiteBackground
    ? `<rect width="${size[0]}" height="${size[1]}" fill="#fff"/>\n`
    : '';
}

function generateMultiLineSvg(
  coords: [Coord, Coord][],
  {
    strokeWidth = 1,
    size,
    whiteBackground,
  }: {
    strokeWidth: number;
    size: [number, number];
    whiteBackground?: boolean;
  }
) {
  return `<svg viewBox="0 0 ${size[0]} ${
    size[1]
  }" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="${strokeWidth}">
${backgroundRect(size, whiteBackground)}${coords
    .map((coord) => {
      return `<line x1="${coord[0][0]}" y1="${coord[0][1]}" x2="${coord[1][0]}" y2="${coord[1][1]}"/>`;
    })
    .join('\n')}
</svg>
  `;
}

function generateSinglePolySvg(
  coords: [Coord, Coord][],
  {
    strokeWidth = 1,
    size,
    whiteBackground,
  }: {
    strokeWidth: number;
    size: [number, number];
    whiteBackground?: boolean;
  }
) {
  return `<svg viewBox="0 0 ${size[0]} ${
    size[1]
  }" xmlns="http://www.w3.org/2000/svg">
  ${backgroundRect(size, whiteBackground)}<polyline points="${coords
    .map((coordPair) => coordPair[0].join(','))
    .join(' ')}" fill="none" stroke="black" stroke-width="${strokeWidth}"/>
</svg>
  `;
}

export function generateSvg(
  coords: [Coord, Coord][],
  options: {
    singleLine: boolean;
    strokeWidth: number;
    size: [number, number];
    whiteBackground?: boolean;
    smoothingAmount?: number;
  }
) {
  if (options.singleLine) {
    if (options.smoothingAmount && options.smoothingAmount > 0) {
      return generateSmoothSvg(coords, {
        ...options,
        smoothingAmount: options.smoothingAmount,
      });
    }
    return generateSinglePolySvg(coords, options);
  } else return generateMultiLineSvg(coords, options);
}
