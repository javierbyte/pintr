export default function Draw(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  function line(
    from: [number, number],
    to: [number, number],
    ops: { color?: string; width?: number } = { color: '#000', width: 1 }
  ) {
    const { color = '#000', width = 1 } = ops;

    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  function lineBuffer(from: [number, number], to: [number, number]) {
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
  }

  function stroke(
    ops: { color?: string; width?: number } = { color: '#000', width: 1 }
  ) {
    const { color = '#000', width = 1 } = ops;

    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.beginPath();
  }

  return {
    line,
    lineBuffer,
    stroke,
  };
}
