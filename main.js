import { imageToRawData, ctxToRGBMatrix } from "canvas-image-utils";

import { canvasDataToGrayscale } from "./lib/canvasDataToGrayscale.js";
import { scanLine } from "./lib/scan.js";
import { generatePolySvg } from "./lib/svg.js";

import { intRnd, debounce } from "./lib/utils.js";
import { faceDetector } from "./lib/face.js";

import Draw from "./lib/draw.js";

window.IMAGE_SRC = "./test.jpg";
window.CURRENT_DRAWING = new Date().getTime();
window.COORDS = [];

const DRAW_SIZE = 1080;

const ORIGINAL_CONFIG = {
  singleLine: true,
  faceApi: false,
  baseLineNumber: 4 * 1000,
  updateSampleRate: 128,
  addColor: "#000",
  substractionColor: "rgba(255,255,255,30%)",
  precisionRange: [16, 28],
};
const CONFIG = JSON.parse(JSON.stringify(ORIGINAL_CONFIG));

const canvasSrcEl = document.querySelector("canvas#src");
const drawEl = document.querySelector("canvas#draw");
drawEl.width = DRAW_SIZE;
drawEl.height = DRAW_SIZE;
const ctx = drawEl.getContext("2d");
const draw = Draw(ctx);

const S = {
  matrix: [],
};

async function main(imgSrc) {
  window.CURRENT_DRAWING = new Date().getTime();
  window.COORDS = [];

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, DRAW_SIZE, DRAW_SIZE);

  document.querySelector("#srcimg").style.backgroundImage = `url("${imgSrc}")`;

  const data = await imageToRawData(imgSrc, {
    size: DRAW_SIZE,
    canvas: canvasSrcEl,
  });

  const { canvasData, averageLightness } = canvasDataToGrayscale(data);
  data.ctx.putImageData(canvasData, 0, 0);

  if (CONFIG.faceApi) {
    try {
      await faceDetector(canvasSrcEl, data.ctx);
    } catch (e) {
      console.warn("no face");
    }
  }

  document.querySelector(".loading").style.display = "none";

  const ctxSrc = data.ctx;

  S.matrix = ctxToRGBMatrix(ctxSrc);

  const drawSrc = Draw(data.ctx);

  let lP = [
    Math.floor(Math.random() * DRAW_SIZE),
    Math.floor(Math.random() * DRAW_SIZE),
  ];

  while (
    S.matrix[lP[0]][lP[1]].r +
      S.matrix[lP[0]][lP[1]].g +
      S.matrix[lP[0]][lP[1]].b ===
    255 * 3
  ) {
    lP = [
      Math.floor(Math.random() * DRAW_SIZE),
      Math.floor(Math.random() * DRAW_SIZE),
    ];
  }

  function drawSequenceLine() {
    let from = lP;

    let toFrom = CONFIG.singleLine ? 0 : CONFIG.precisionRange[0] * 2;
    while (toFrom--) {
      let tmpFrom = [
        Math.floor(Math.random() * DRAW_SIZE),
        Math.floor(Math.random() * DRAW_SIZE),
      ];

      if (
        S.matrix[from[0]][from[1]].r +
          S.matrix[from[0]][from[1]].g +
          S.matrix[from[0]][from[1]].b >
        S.matrix[tmpFrom[0]][tmpFrom[1]].r +
          S.matrix[tmpFrom[0]][tmpFrom[1]].g +
          S.matrix[tmpFrom[0]][tmpFrom[1]].b
      ) {
        from = tmpFrom;
      }
    }

    let toExplore = intRnd(...CONFIG.precisionRange);

    let to;
    let light = 1;
    while (toExplore--) {
      let tmpTo = [
        Math.floor(Math.random() * DRAW_SIZE),
        Math.floor(Math.random() * DRAW_SIZE),
      ];

      const tmpLight = scanLine(from, tmpTo, S.matrix, true);

      if (tmpLight <= light) {
        light = tmpLight;
        to = tmpTo;
      }
    }

    light = scanLine(from, to, S.matrix, true);

    window.COORDS.push([from, to]);

    draw.lineBuffer(from, to, {
      color: `#000`,
    });
    drawSrc.lineBuffer(from, to, {
      color: CONFIG.substractionColor,
    });

    lP = to;
  }

  let initialC = Math.floor((CONFIG.baseLineNumber / averageLightness) * 128);

  let c = initialC;
  function drawLinesInBatch(currentDrawing) {
    return new Promise((resolve) => {
      const time = new Date().getTime();
      while (new Date().getTime() < time + 15 && c-- > 0) {
        if (currentDrawing !== window.CURRENT_DRAWING) return;

        if (c % CONFIG.updateSampleRate === 0) {
          draw.stroke({ color: CONFIG.addColor });
          drawSrc.stroke({ color: CONFIG.substractionColor, width: 1.5 });

          S.matrix = ctxToRGBMatrix(ctxSrc);
        }
        drawSequenceLine();
      }

      draw.stroke({ color: CONFIG.addColor });
      drawSrc.stroke({ color: CONFIG.substractionColor, width: 1.5 });

      window.requestAnimationFrame(resolve);
    });
  }
  async function keepBatching(currentDrawing) {
    while (c > 0 && currentDrawing === window.CURRENT_DRAWING) {
      await drawLinesInBatch(currentDrawing);
    }
  }
  keepBatching(window.CURRENT_DRAWING);
}
main(window.IMAGE_SRC);

function readFile() {
  if (this.files && this.files[0]) {
    const FR = new FileReader();
    FR.addEventListener("load", function (e) {
      window.IMAGE_SRC = e.target.result;
      main(window.IMAGE_SRC);
    });

    FR.readAsDataURL(this.files[0]);
  }
}

// UI
function onChangeSettings() {
  const lines = document.querySelector("input[type='range']#lines").value;
  const singleline = document.querySelector(
    "input[type='range']#singleline"
  ).value;
  const faceApi = document.querySelector("input[type='range']#faceapi").value;
  const contrast = document.querySelector("input[type='range']#contrast").value;
  const definition = document.querySelector(
    "input[type='range']#definition"
  ).value;

  CONFIG.baseLineNumber = (ORIGINAL_CONFIG.baseLineNumber / 50) * lines;
  CONFIG.substractionColor = `rgba(255, 255, 255, ${100 - contrast}%)`;
  CONFIG.precisionRange = [definition, definition * 2];
  CONFIG.singleLine = Number(singleline) ? true : false;
  CONFIG.faceApi = Number(faceApi) ? true : false;

  if (CONFIG.faceApi) {
    document.querySelector(".loading").style.display = "block";
  }

  main(window.IMAGE_SRC);
}

document.querySelector("#inp").addEventListener("change", readFile);

document.querySelector("#inputbutton").addEventListener("click", () => {
  document.querySelector("#inp").click();
});

document.querySelectorAll("input[type='range']").forEach((input) => {
  input.addEventListener("change", debounce(onChangeSettings, 256));
});

document.querySelector("#download").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "PINTR.png";
  link.href = document.querySelector("canvas#draw").toDataURL();
  link.click();
});

document.querySelector("#downloadsvg").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "PINTR.svg";
  const svgData = generatePolySvg(window.COORDS);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  link.href = svgUrl;
  link.click();
});
