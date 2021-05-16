import { dataNumToColor } from "../utils/color";

export const scaleNum = (num, canvas) => {
  const scale = canvas.height / canvas.clientHeight;
  return num * scale;
};

export const strokeStyles = (ctx, { strokeStyle } = {}) => {
  ctx.lineWidth = 50;
  ctx.strokeStyle = strokeStyle || ctx.strokeStyle;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
};

export const ctxPathFrom = (ctx, x, y) => {
  ctx.beginPath();
  ctx.moveTo(x, y);
};

export const ctxPathTo = (ctx, x, y) => {
  ctx.lineTo(x, y);
  ctx.stroke();
};

export const getDistanceFromCanvas = (x, y, canvas) => {
  if (!canvas) throw new Error("Canvas element not found");

  const maxX = (() => {
    let xLeft = 0,
      xRight = 0;
    if (x < 0) xLeft = -x;
    if (x > canvas.clientWidth) xRight = x - canvas.clientWidth;
    return Math.max(xLeft, xRight);
  })();

  const maxY = (() => {
    let yTop = 0,
      yBottom = 0;
    if (y < 0) yTop = -y;
    if (y > canvas.clientHeight) yBottom = y - canvas.clientHeight;
    return Math.max(yTop, yBottom);
  })();

  return Math.max(maxX, maxY);
};

/**
 * Initializes the canvases within the Web Worker
 * @param {Worker} worker
 */
export const initCanvas = async (worker) => {
  const drawCanvas = document.getElementById("draw-area");
  const ocDraw = drawCanvas.transferControlToOffscreen();

  const viewCanvas = document.getElementById("view-area");
  const ocView = viewCanvas.transferControlToOffscreen();
  worker.postMessage({ event: "init-canvas", data: [ocDraw, ocView] }, [
    ocDraw,
    ocView,
  ]);

  worker.addEventListener("message", (e) => {
    if (e.data.event === "init-canvas" && e.data.data === true)
      return Promise.resolve();
    return Promise.reject("Canvas initialization failed");
  });

  return [drawCanvas, viewCanvas];
};

export class CanvasRenderer {
  /** @type {OffscreenCanvas} */
  canvas = null;
  /** @type {OffscreenCanvasRenderingContext2D} */
  ctx = null;
  /**
   * @param {OffscreenCanvas} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  clear = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  };

  drawLine = (xy1, xy2, color) => {
    const { x, y } = xy2;
    if (!xy1) {
      ctxPathFrom(this.ctx, x, y);
    } else {
      strokeStyles(this.ctx, { strokeStyle: color });

      let [x0, y0] = [xy1.x, xy1.y];
      if (!(x0 > -1 && y0 > -1)) ctxPathFrom(this.ctx, x0, y0);
      ctxPathTo(this.ctx, x, y);
    }
  };

  redraw = (points = []) => {
    if (!this.ctx) return;

    if (points.length % 3 !== 0) {
      console.error(points);

      throw new Error("Batch length must be a multiple of 3");
    }

    let lastColor = "#000";
    this.ctx.beginPath();
    strokeStyles(this.ctx);

    for (let i = 0; i < points.length - 1; i += 3) {
      let [x0, y0, c0] = [points[i - 3], points[i - 2], points[i - 1]];
      let [x1, y1, c1] = [points[i], points[i + 1], points[i + 2]];
      let [x2, y2] = [points[i + 3], points[i + 4], points[i + 5]];

      if (x1 < 0 || x2 < 0) continue;
      else if (x1 === undefined || x2 === undefined) break;

      if (!(x0 > -1 && y0 > -1)) this.ctx.moveTo(x1, y1);
      if (c0 !== c1) {
        this.ctx.stroke();
        this.ctx.beginPath();
        lastColor = dataNumToColor(c1);
        if (c1 > -1) strokeStyles(this.ctx, { strokeStyle: lastColor });
      }
      this.ctx.lineTo(x2, y2);
    }
    this.ctx.stroke();
  };
}
