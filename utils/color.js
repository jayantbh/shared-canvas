import { ACTIONS } from "./constants";

/**
 * Converts a hex color to an integer
 * @param {*} hexStr | #fff, #abcdef, #000
 */
export const colorToDataNum = (hexStr) => {
  return ACTIONS.COLOR_SET + parseInt("0x" + hexStr.slice(1), 16);
};

/**
 * Converts an integer to a hex
 * @param {*} num
 * @returns
 */
export const dataNumToColor = (num) => {
  const hex = (num - ACTIONS.COLOR_SET).toString(16);
  return "#" + hex.padStart(6, hex);
};
