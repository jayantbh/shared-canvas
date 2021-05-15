import io from "socket.io/client-dist/socket.io";
import { dataNumToColor, colorToDataNum } from "../utils/color";
import { getEventXY } from "../utils/dom";
import {
  clearCanvas,
  ctxPathFrom,
  ctxPathTo,
  scaleNum,
  strokeStyles,
  getDistanceFromCanvas,
} from "../utils/canvas";

const socket = io();
console.info("Loaded!", socket);

const getBackendStatus = async () => {
  const response = await fetch("/status").then((r) => r.status);
  console.info("Backend status from client: 200");
};

let frame = null;
let lastCoords = null;
let color = "#000";

const canvas = document.getElementById("draw-area");
const viewCanvas = document.getElementById("view-area");

let doDraw = false;
const setDoDraw = (bool) => (doDraw = bool);

let batch = [];
let myArt = [];
const serverBatch = () => {
  let batchIntervalId = setInterval(() => {
    if (!batch.length) return;

    clearInterval(batchIntervalId);

    myArt.push(...batch);
    const length = batch.length;

    socket.emit("image", new Float32Array(batch).buffer, () => {
      console.log("updated on server");
      batch.splice(0, length);
      serverBatch();
    });
  }, 50);
};
serverBatch();

const batchPoint = (x = -1, y = -1, col = color) => {
  batch.push(x, y, colorToDataNum(col));
};

const redraw = (points = [], ctx) => {
  if (!ctx) return;

  if (points.length % 3 !== 0) {
    console.error(points);

    throw new Error("Batch length must be a multiple of 3");
  }

  for (let i = 0; i < points.length - 1; i += 3) {
    let [x0, y0, c0] = [points[i - 3], points[i - 2], points[i - 1]];
    let [x1, y1, c1] = [points[i], points[i + 1], points[i + 2]];
    let [x2, y2, c2] = [points[i + 3], points[i + 4], points[i + 5]];

    if (x1 < 0 || x2 < 0) continue;
    else if (x1 === undefined || x2 === undefined) break;

    strokeStyles(ctx);

    if (!(x0 > -1 && y0 > -1)) ctxPathFrom(ctx, x1, y1);
    if (c1 > -1) strokeStyles(ctx, { strokeStyle: dataNumToColor(c1) });
    ctxPathTo(ctx, x2, y2);
  }

  strokeStyles(ctx, { strokeStyle: color });
};

let globalArt = {};
let myId = null;

/**
 * Only fired on connection
 */
socket.on("image", function (allArt, myArt) {
  globalArt = allArt.reduce(
    (acc, art) => ({
      ...acc,
      [art.id]: new Float32Array(art.points),
    }),
    {}
  );
  const viewCtx = viewCanvas?.getContext("2d");
  const ctx = canvas?.getContext("2d");
  Object.values(globalArt).forEach((pts) => redraw(pts, viewCtx));
  redraw(new Float32Array(myArt), ctx);
});

/**
 * Updates from other clients
 */
socket.on("image-update", function (id, points) {
  myId = id;
  points = new Float32Array(points);

  const existingPts = globalArt[id] || [];
  globalArt = {
    ...globalArt,
    [id]: existingPts.concat(...points),
  };
  const viewCtx = viewCanvas?.getContext("2d");
  redraw([...existingPts.slice(-3), ...points], viewCtx);
});

/**
 * Clear from all clients, including self
 */
socket.on("image-clear", function (id) {
  console.log({ id });

  delete globalArt[id];
  clearCanvas(viewCanvas);

  const viewCtx = viewCanvas?.getContext("2d");
  Object.values(globalArt).forEach((pts) => redraw(pts, viewCtx));

  if (id === myId) {
    myArt = [];
    clearCanvas(canvas);
    return;
  }
});

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const onMouseMove = (e) => {
  if (!doDraw) lastCoords = null;
  if (!canvas || !doDraw) return;

  if (frame) cancelAnimationFrame(frame);

  frame = requestAnimationFrame(() => {
    const rect = canvas.getBoundingClientRect();
    let { x, y } = getEventXY(e, rect);
    [x, y] = [
      clamp(scaleNum(x, canvas), 0, canvas.width),
      clamp(scaleNum(y, canvas), 0, canvas.width),
    ];

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    batchPoint(x, y);

    if (!lastCoords) {
      ctxPathFrom(ctx, x, y);
      lastCoords = { x, y };
      return;
    }

    strokeStyles(ctx, { strokeStyle: color });

    let [x0, y0] = [lastCoords.x, lastCoords.y];
    if (!(x0 > -1 && y0 > -1)) ctxPathFrom(ctx, x0, y0);
    ctxPathTo(ctx, x, y);
    lastCoords = { x, y };
  });
};

const allowDraw = (e) => {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  let { x, y } = getEventXY(e, rect);
  if (getDistanceFromCanvas(x, y, canvas) > 50) return;
  return true;
};

const onDrawEnd = (e) => {
  e.stopPropagation();
  setDoDraw(false);
  requestAnimationFrame(() => {
    lastCoords = null;
    batchPoint();
  });
};

const onDrawStart = (e) => {
  e.stopPropagation();
  if (!allowDraw(e)) return;
  requestAnimationFrame(() => (lastCoords = null));
  setDoDraw(true);
};

const onTrigger = (e) => {
  e.stopPropagation();
  const hasTrigger = e.buttons === 1;
  lastCoords = null;
  if (hasTrigger) {
    if (allowDraw(e)) setDoDraw(true);
  } else {
    setDoDraw(false);
    requestAnimationFrame(() => {
      batchPoint();
    });
  }
};

const onTouchStart = onDrawStart;

const onTouchEnd = onDrawEnd;

const drawStuff = () => {
  if (!canvas) throw new Error("Canvas element not found");

  document.body.onmouseup = onTrigger;
  document.body.onmousedown = onTrigger;
  document.body.onmousemove = onMouseMove;
  document.body.ontouchstart = onTouchStart;
  document.body.ontouchmove = onMouseMove;
  document.body.ontouchend = onTouchEnd;
  document.body.onmouseleave = onDrawEnd;
};

window.onload = () => {
  getBackendStatus();
  drawStuff();

  document.getElementById("clear-button").onclick = () => {
    socket.emit("clear-image", () => {
      clearCanvas(canvas);
    });
  };

  const noOp = (e) => e.stopPropagation();

  [...document.querySelectorAll("#color-list svg")].forEach((el) => {
    el.onmouseup = noOp;
    el.onmousedown = noOp;
    el.onmousemove = noOp;
    el.ontouchstart = noOp;
    el.ontouchmove = noOp;
    el.ontouchend = noOp;
    el.onmouseleave = noOp;
    el.onclick = (e) => {
      e.stopPropagation();
      const currColor = el.getAttribute("color");
      color = currColor;
    };
  });
};
