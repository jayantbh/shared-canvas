export const getEventXY = (e, rect) => {
  if (e.clientX !== undefined && e.clientY !== undefined) {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  } if (e.touches !== undefined) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    };
  }

  return { x: -Infinity, y: -Infinity };
};
