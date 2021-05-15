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

export const clearCanvas = (canvas) => {
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
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
