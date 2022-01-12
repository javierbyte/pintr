import { canvasDataToGrayscale } from './canvasDataToGrayscale.js';

export function pinterCreator(data) {
  const WIDTH = data.width;
  const HEIGHT = data.height;

  const canvasTmp = document.createElement('canvas');
  canvasTmp.width = WIDTH;
  canvasTmp.height = HEIGHT;
  const ctx = canvasTmp.getContext('2d');

  console.log('> Starting PINTR', data);

  const { canvasData, averageLightness } = canvasDataToGrayscale(data);
  ctx.putImageData(canvasData, 0, 0);

  document.body.appendChild(canvasTmp);

  function render() {}
  // function stop() {}

  return {
    render,
  };
}
