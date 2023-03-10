export function polar2cartesian({
  distance,
  angle,
}: {
  distance: number;
  angle: number;
}) {
  return {
    x: distance * Math.cos(angle),
    y: distance * Math.sin(angle),
  };
}

export function cartesian2polar({ x, y }: { x: number; y: number }) {
  return {
    distance: Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)),
    angle: Math.atan2(y, x),
  };
}
