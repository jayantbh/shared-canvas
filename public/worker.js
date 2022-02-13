import { CanvasRenderer } from '../utils/canvas';
/**
 * @type {Object<string, CanvasRenderer>}
 */
const canvas = {
  view: null,
  draw: null,
};

onmessage = (e) => {
  try {
    const { event, data } = e.data;

    switch (event) {
      case 'text': {
        postMessage({ event: 'text', data });
        break;
      }
      case 'init-canvas': {
        canvas.draw = new CanvasRenderer(data[0]);
        canvas.view = new CanvasRenderer(data[1]);
        postMessage({ event: 'init-canvas', data: true });
        break;
      }
      case 'clear-canvas': {
        // data = 'view' | 'draw'

        canvas[data].clear();
        break;
      }
      case 'redraw': {
        // data = {points = [], canvas: 'view' | 'draw'}

        canvas[data.canvas].redraw(data.points);
        break;
      }
      case 'bulk-redraw': {
        // data = [][] // Array of points' arrays

        data.forEach((points) => canvas.view.redraw(points));
        break;
      }
      case 'draw-line': {
        // data = {xy1 = null | {x, y}, xy2 = {x, y}, color = hex string}

        canvas.draw.drawLine(data.xy1, data.xy2, data.color);
        break;
      }
      default: {
        postMessage({ event: 'unhandled-event', data: e.data });
      }
    }
  } catch (err) {
    postMessage({ event: 'error', data: err });
  }
};
