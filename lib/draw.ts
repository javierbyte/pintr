export default function Draw(
  ctx: CanvasRenderingContext2D,
  singleLine = false
) {
  ctx.beginPath();
  let hasPoint = false;

  function lineBuffer(from: [number, number], to: [number, number]) {
    if (!singleLine || !hasPoint) ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
    hasPoint = true;
  }

  function stroke(
    ops: { color?: string; width?: number } = { color: '#000', width: 1 }
  ) {
    const { color = '#000', width = 1 } = ops;

    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.beginPath();
    hasPoint = false;
  }

  return {
    lineBuffer,
    stroke,
  };
}
