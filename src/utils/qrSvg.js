// src/utils/qrSvg.js
//
// Same QR as components/common/QrCode.jsx, but returned as an SVG *string* so it
// can be dropped into the report's print / PDF HTML (which is built as text).
import { makeQrMatrix } from "./qrCodeMatrix";

const MARGIN = 2;

export function qrSvgString(text, size = 62) {
  if (!text) return "";
  let modules;
  try {
    modules = makeQrMatrix(String(text));
  } catch {
    return ""; // too long for the built-in generator
  }
  const total = modules.length + MARGIN * 2;
  let d = "";
  modules.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) { x += 1; continue; }
      let run = 1;
      while (x + run < row.length && row[x + run]) run += 1;
      d += `M${x + MARGIN} ${y + MARGIN}h${run}v1h-${run}z`;
      x += run;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="#ffffff"/><path d="${d}" fill="#000000"/></svg>`;
}