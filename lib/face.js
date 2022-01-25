function drawLandmark(ctx, landmark, ops = {}) {
  const { color = '#0008', close = false, shiftY = 0 } = ops;

  ctx.beginPath();
  ctx.lineWidth = 23;
  ctx.moveTo(landmark[0]._x, landmark[0]._y + shiftY);

  for (const point of landmark) {
    ctx.lineTo(point._x, point._y + shiftY);
  }
  if (close) {
    ctx.lineTo(landmark[0]._x, landmark[0]._y + shiftY);
  }

  ctx.strokeStyle = color;
  ctx.stroke();
}

export async function faceDetector(canvas, ctx) {
  await window.faceapi.nets.ssdMobilenetv1.loadFromUri('weights');
  await window.faceapi.nets.faceLandmark68TinyNet.loadFromUri('weights');

  const results = await window.faceapi
    .detectSingleFace(canvas)
    .withFaceLandmarks(true);

  if (!results) return;

  const rightEye = results.landmarks.getRightEye();
  const leftEye = results.landmarks.getLeftEye();
  const jawOutline = results.landmarks.getJawOutline();

  drawLandmark(ctx, rightEye, { close: true });
  drawLandmark(ctx, leftEye, { close: true });

  drawLandmark(ctx, jawOutline.slice(2, -2), {
    color: '#0004',
    shiftY: 10,
  });
}
