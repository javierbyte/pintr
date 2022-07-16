const RED_PREFERENCE = 0.1;
const WEIGHTS = {
  r: 0.299 + RED_PREFERENCE,
  g: 0.587 + RED_PREFERENCE * -0.5,
  b: 0.114 + RED_PREFERENCE * -0.5,
};

export function canvasDataToGrayscale(canvasData: ImageData): {
  canvasData: ImageData;
  averageLightness: number;
} {
  let pixels = canvasData.data;

  let minLightness = Infinity;
  let maxLightness = 0;
  let averageLightness = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    let lightness =
      pixels[i] * WEIGHTS.r +
      pixels[i + 1] * WEIGHTS.g +
      pixels[i + 2] * WEIGHTS.b;

    if (pixels[i + 3] < 128) {
      lightness = 255;
    }

    minLightness = Math.min(minLightness, lightness);
    maxLightness = Math.max(maxLightness, lightness);
    averageLightness += lightness;
  }
  averageLightness = Math.round(averageLightness / (pixels.length / 4));

  minLightness += 32;
  maxLightness -= 32;

  const contrast = 255 / (maxLightness - minLightness);

  for (let i = 0; i < pixels.length; i += 4) {
    let lightness =
      pixels[i] * WEIGHTS.r +
      pixels[i + 1] * WEIGHTS.g +
      pixels[i + 2] * WEIGHTS.b;

    pixels[i] = Math.round(lightness * contrast) - minLightness;
    pixels[i + 1] = Math.round(lightness * contrast) - minLightness;
    pixels[i + 2] = Math.round(lightness * contrast) - minLightness;
  }

  return { canvasData, averageLightness };
}
