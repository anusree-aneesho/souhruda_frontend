// src/components/common/QrCode.jsx
//
// SCRUM-142: real QR code rendering (SVG, scannable) for sample labels —
// lets lab-processing staff scan straight to the collection record instead
// of typing in the hc_code by hand.
//
// Uses the built-in generator in utils/qrCodeMatrix.js (no npm package needed).
import { useMemo } from "react";
import { makeQrMatrix } from "../../utils/qrCodeMatrix";

const MARGIN = 2; // quiet zone, in modules

export default function QrCode({ value, size = 96, className = "" }) {
  const modules = useMemo(() => {
    if (!value) return null;
    try {
      return makeQrMatrix(String(value));
    } catch {
      // Value too long for the built-in generator — render nothing rather than crash the modal.
      return null;
    }
  }, [value]);

  if (!value || !modules) return null;

  const total = modules.length + MARGIN * 2;

  // One path, merging horizontal runs of dark modules into single rectangles
  let d = "";
  modules.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x += 1;
        continue;
      }
      let run = 1;
      while (x + run < row.length && row[x + run]) run += 1;
      d += `M${x + MARGIN} ${y + MARGIN}h${run}v1h-${run}z`;
      x += run;
    }
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${total} ${total}`}
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-label={`QR code ${value}`}
    >
      <rect width={total} height={total} fill="#ffffff" />
      <path d={d} fill="#000000" />
    </svg>
  );
}