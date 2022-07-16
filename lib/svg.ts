import type { Coord } from './PINTR';

function generateMultiLineSvg(
  coords: [Coord, Coord][],
  { strokeWidth = 1, size }: { strokeWidth: number; size: [number, number] }
) {
  return `<svg viewBox="0 0 ${size[0]} ${
    size[1]
  }" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="${strokeWidth}">
${coords
  .map((coord) => {
    return `<line x1="${coord[0][0]}" y1="${coord[0][1]}" x2="${coord[1][0]}" y2="${coord[1][1]}"/>`;
  })
  .join('\n')}
</svg>
  `;
}

function generateSinglePolySvg(
  coords: [Coord, Coord][],
  { strokeWidth = 1, size }: { strokeWidth: number; size: [number, number] }
) {
  return `<svg viewBox="0 0 ${size[0]} ${
    size[1]
  }" xmlns="http://www.w3.org/2000/svg">
  <polyline points="${coords
    .map((coordPair) => coordPair[0].join(','))
    .join(' ')}" fill="none" stroke="black" stroke-width="${strokeWidth}"/>
</svg>
  `;
}

export function generateSvg(
  coords: [Coord, Coord][],
  options: {
    singleLine: true | false;
    strokeWidth: number;
    size: [number, number];
  }
) {
  console.warn('>generateSvg', options);
  if (options.singleLine) {
    return generateSinglePolySvg(coords, options);
  } else return generateMultiLineSvg(coords, options);
}
