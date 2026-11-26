import { segmentsToPaths } from './coords-txt';

import type { Coord } from './PINTR';

export function generateSvg(
  coords: [Coord, Coord][],
  {
    singleLine,
    strokeWidth,
    size,
    whiteBackground,
  }: {
    singleLine: boolean;
    strokeWidth: number;
    size: [number, number];
    whiteBackground?: boolean;
  }
) {
  const background = whiteBackground
    ? `<rect width="${size[0]}" height="${size[1]}" fill="#fff" stroke="none"/>\n`
    : '';

  const lines = singleLine
    ? segmentsToPaths(coords).map((path) => {
        return `<polyline points="${path.map((point) => point.join(',')).join(' ')}"/>`;
      })
    : coords.map(([from, to]) => {
        return `<line x1="${from[0]}" y1="${from[1]}" x2="${to[0]}" y2="${to[1]}"/>`;
      });

  return `<svg viewBox="0 0 ${size[0]} ${size[1]}" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="black" stroke-width="${strokeWidth}" stroke-linejoin="round">
${background}${lines.join('\n')}
</svg>
`;
}
