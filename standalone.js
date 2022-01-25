import { pinterCreator } from './lib/PINTR.js';

const CONFIG = {
  addColor: '#000',
  baseLineNumber: 3600,
  faceApi: false,
  makeSmoothSvg: false,
  precisionRange: 16,
  singleLine: true,
  strokeWidth: 1.5,
  substractionColor: `rgba(255, 255, 255, 25%)`,
  updateSampleRate: 90,
};

async function main(imgSrc) {
  const PINTR = await pinterCreator(imgSrc, {
    canvasDrawEl: document.querySelector('canvas#draw'),
  });
  PINTR.render({
    config: CONFIG,
  });
}

main('./test.jpg');
