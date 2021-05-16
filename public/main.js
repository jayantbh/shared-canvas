import io from "socket.io/client-dist/socket.io";
import { colorToDataNum } from "../utils/color";
import { getEventXY } from "../utils/dom";
import { scaleNum, getDistanceFromCanvas, initCanvas } from "../utils/canvas";

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

class WorkerCanvas {
  /** @type {Worker} will never be null due to constructor check*/
  worker = null;
  socket = null;
  initialized = false;
  doDraw = false;
  lastCoords = null;
  frame = -1;
  color = "#000";

  batch = [];
  myArt = [];
  globalArt = {};
  myId = null;

  canvas = null;
  viewCanvas = null;

  /**
   * @param {Worker} worker
   */
  constructor(worker) {
    if (!worker || !(worker instanceof Worker))
      throw new Error("Invalid param. Requires a Web Worker instance.");
    this.worker = worker;

    this.initCanvas();
  }

  initCanvas = async () => {
    try {
      [this.canvas, this.viewCanvas] = await initCanvas(this.worker);
      this.initSocket();
      this.initialized = true;
    } catch (e) {
      console.error(e);
    }
  };

  canvasReadyToDraw = () => {
    document.getElementById("svg-loader")?.remove();
    this.drawStuff();
  };

  initSocket = () => {
    this.socket = io();
    console.info("Loaded!", this.socket);

    /**
     * Only fired on connection
     */
    this.socket.on("image", (allArt, myArt, id) => {
      this.myId = id;
      console.log(id);
      this.globalArt = allArt.reduce(
        (acc, art) => ({
          ...acc,
          [art.id]: new Float32Array(art.points),
        }),
        {}
      );
      console.log(allArt, myArt);
      this.redrawGlobal(Object.values(this.globalArt));
      this.redraw(new Float32Array(myArt), "draw");
      this.canvasReadyToDraw();
    });

    /**
     * Updates from other clients
     */
    this.socket.on("image-update", (id, points) => {
      points = new Float32Array(points);

      const existingPts = this.globalArt[id] || [];
      this.globalArt = {
        ...this.globalArt,
        [id]: existingPts.concat(...points),
      };
      this.redraw([...existingPts.slice(-6), ...points], "view");
    });

    /**
     * Clear from all clients, including self
     */
    this.socket.on("image-clear", (id) => {
      console.log({ id });

      delete this.globalArt[id];
      this.clearCanvas("view");

      this.redrawGlobal(Object.values(this.globalArt));

      if (id === this.myId) {
        this.myArt = [];
        this.clearCanvas("draw");
        return;
      }
    });

    this.serverBatch();
  };

  serverBatch = () => {
    let batchIntervalId = setInterval(() => {
      if (!this.batch.length) return;

      clearInterval(batchIntervalId);

      this.myArt.push(...this.batch);
      const length = this.batch.length;

      this.socket.emit("image", new Float32Array(this.batch).buffer, () => {
        console.log("updated on server");
        this.batch.splice(0, length);
        this.serverBatch();
      });
    }, 50);
  };

  batchPoint = (x = -1, y = -1, col = this.color) => {
    this.batch.push(x, y, colorToDataNum(col));
  };

  /**
   * @param {Float32Array} points
   * @param {'draw' | 'view'} canvas
   */
  redraw = (points, canvas) => {
    this.worker.postMessage({ event: "redraw", data: { points, canvas } });
  };

  /**
   * @param {Float32Array[]} arrayOfPoints
   */
  redrawGlobal = (arrayOfPoints) => {
    this.worker.postMessage({ event: "bulk-redraw", data: arrayOfPoints });
  };

  /**
   * @param {{x: number, y: number} | null} xy1
   * @param {{x: number, y: number} | null} xy2
   */
  drawLine = (xy1, xy2) => {
    console.log(xy1, xy2, this.color);
    this.worker.postMessage({
      event: "draw-line",
      data: {
        xy1,
        xy2,
        color: this.color,
      },
    });
  };

  onMouseMove = (e) => {
    if (!this.doDraw) this.lastCoords = null;
    if (!this.canvas || !this.doDraw) return;

    if (this.frame) cancelAnimationFrame(this.frame);

    this.frame = requestAnimationFrame(() => {
      const rect = this.canvas.getBoundingClientRect();
      let { x, y } = getEventXY(e, rect);
      [x, y] = [
        clamp(scaleNum(x, this.canvas), 0, this.canvas.width),
        clamp(scaleNum(y, this.canvas), 0, this.canvas.width),
      ];

      this.batchPoint(x, y);
      this.drawLine(this.lastCoords, { x, y });
      this.lastCoords = { x, y };
    });
  };

  allowDraw = (e) => {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    let { x, y } = getEventXY(e, rect);
    if (getDistanceFromCanvas(x, y, this.canvas) > 50) return;
    return true;
  };

  onDrawEnd = (e) => {
    e.stopPropagation();
    this.doDraw = false;
    this.lastCoords = null;
    requestAnimationFrame(() => {
      this.batchPoint();
    });
  };

  onDrawStart = (e) => {
    e.stopPropagation();
    if (!this.allowDraw(e)) return;
    this.lastCoords = null;
    this.doDraw = true;
  };

  onTrigger = (e) => {
    e.stopPropagation();
    const hasTrigger = e.buttons === 1;
    this.lastCoords = null;
    if (hasTrigger) {
      if (this.allowDraw(e)) this.doDraw = true;
    } else {
      this.doDraw = false;
      this.lastCoords = null;
      requestAnimationFrame(() => {
        this.batchPoint();
      });
    }
  };

  onTouchStart = this.onDrawStart;

  onTouchEnd = this.onDrawEnd;

  /**
   * @param {'draw' | 'view'} canvas
   */
  clearCanvas = (canvas) => {
    this.worker.postMessage({ event: "clear-canvas", data: canvas });
  };

  drawStuff = () => {
    if (!this.initialized) throw new Error("Canvas element not found");

    document.body.onmouseup = this.onTrigger;
    document.body.onmousedown = this.onTrigger;
    document.body.onmousemove = this.onMouseMove;
    document.body.ontouchstart = this.onTouchStart;
    document.body.ontouchmove = this.onMouseMove;
    document.body.ontouchend = this.onTouchEnd;
    document.body.onmouseleave = this.onDrawEnd;

    document.getElementById("clear-button").onclick = () => {
      this.socket.emit("clear-image", () => {
        // clearCanvas(canvas);
        this.worker.postMessage({ event: "clear-canvas", data: "draw" });
      });
    };

    const noProp = (e) => e.stopPropagation();

    [...document.querySelectorAll("#color-list svg")].forEach((el) => {
      el.onmouseup = noProp;
      el.onmousedown = noProp;
      el.onmousemove = noProp;
      el.ontouchstart = noProp;
      el.ontouchmove = noProp;
      el.ontouchend = noProp;
      el.onmouseleave = noProp;
      el.onclick = (e) => {
        noProp(e);
        this.color = el.getAttribute("color");
      };
    });
  };

  receiveWorkerEvents = () => {
    this.worker.addEventListener("message", (e) => {
      const { event, data } = e.data;

      switch (event) {
        case "text": {
          console.log(data);
          break;
        }
        case "unhandled-event": {
          console.error("Unhandled event: ", data);
          break;
        }
        default:
          break;
      }
    });
  };
}

/**
 * @param {Worker} worker
 */
const handleWorker = (worker) => {
  new WorkerCanvas(worker);
};

window.onload = () => {
  if (window.Worker) {
    try {
      handleWorker(new Worker(new URL("./worker.js", import.meta.url)));
    } catch (error) {
      console.log("Web Worker registration failed", error);
    }
  }
};
