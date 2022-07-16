import type { Coord } from './PINTR';

import { tweenValue } from './utils';

export function generateSmoothSvg(
  coords: [Coord, Coord][],
  {
    smoothingAmount = 50,
    strokeWidth = 1,
    size,
  }: { smoothingAmount: number; strokeWidth?: number; size: [number, number] }
) {
  const points = coords.map((coord) => coord[0]);

  const calculatedSmoothing = tweenValue(smoothingAmount, [
    [0, 0],
    [50, 0.1],
    [100, 1],
  ]);

  // Properties of a line
  // I:  - pointA (array) [x,y]: coordinates
  //     - pointB (array) [x,y]: coordinates
  // O:  - (object) { length: l, angle: a }: properties of the line
  const line = (pointA: Coord, pointB: Coord) => {
    const lengthX = pointB[0] - pointA[0];
    const lengthY = pointB[1] - pointA[1];
    return {
      length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
      angle: Math.atan2(lengthY, lengthX),
    };
  };

  // Position of a control point
  // I:  - current (array) [x, y]: current point coordinates
  //     - previous (array) [x, y]: previous point coordinates
  //     - next (array) [x, y]: next point coordinates
  //     - reverse (boolean, optional): sets the direction
  // O:  - (array) [x,y]: a tuple of coordinates
  const controlPoint = (
    current: Coord,
    previous: Coord,
    next: Coord,
    reverse?: true | false
  ) => {
    // When 'current' is the first or last point of the array
    // 'previous' or 'next' don't exist.
    // Replace with 'current'
    const p = previous || current;
    const n = next || current;

    // Properties of the opposed-line
    const o = line(p, n);

    // If is end-control-point, add PI to the angle to go backward

    const angle = o.angle + (reverse ? Math.PI : 0);
    const length = o.length * calculatedSmoothing;

    // The control point position is relative to the current point
    const x = current[0] + Math.cos(angle) * length;
    const y = current[1] + Math.sin(angle) * length;
    return [x, y];
  };

  // Create the bezier curve command
  // I:  - point (array) [x,y]: current point coordinates
  //     - i (integer): index of 'point' in the array 'a'
  //     - a (array): complete array of points coordinates
  // O:  - (string) 'C x2,y2 x1,y1 x,y': SVG cubic bezier C command
  const bezierCommand = (point: Coord, i: number, a: Coord[]) => {
    // start control point
    const cps = controlPoint(a[i - 1], a[i - 2], point);

    // end control point
    const cpe = controlPoint(point, a[i - 1], a[i + 1], true);
    return `C ${cps[0]},${cps[1]} ${cpe[0]},${cpe[1]} ${point[0]},${point[1]}`;
  };

  // Render the svg <path> element
  // I:  - points (array): points coordinates
  //     - command (function)
  //       I:  - point (array) [x,y]: current point coordinates
  //           - i (integer): index of 'point' in the array 'a'
  //           - a (array): complete array of points coordinates
  //       O:  - (string) a svg path command
  // O:  - (string): a Svg <path> element
  const svgPath = (
    points: Coord[],
    command: (point: Coord, i: number, a: Coord[]) => void
  ) => {
    // build the d attributes by looping over the points
    const d = points.reduce(
      (acc, point, i, a) =>
        i === 0
          ? `M ${point[0]},${point[1]}`
          : `${acc} ${command(point, i, a)}`,
      ''
    );
    return `<path d="${d}" fill="none" stroke="black" stroke-width="${strokeWidth}" />`;
  };

  // const svg = document.querySelector('.svg')

  // svg.innerHTML = svgPath(points, bezierCommand)

  // console.log(svgPath(points, bezierCommand))

  return `<svg viewBox="0 0 ${size[0]} ${
    size[1]
  }" xmlns="http://www.w3.org/2000/svg" stroke="black">
    ${svgPath(points, bezierCommand)}
  </svg>
  `;
}
