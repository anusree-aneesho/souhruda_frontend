// src/components/common/Barcode.jsx
//
// SCRUM-141: renders a real, scannable Code128 barcode (not just the text
// value) as an SVG so it scales cleanly for both on-screen display and print
// labels. Uses the built-in encoder in utils/code128.js (no npm package needed).
import { useMemo } from "react";
import { encodeCode128 } from "../../utils/code128";

const MARGIN = 4;
const TEXT_GAP = 2;

export default function Barcode({
  value,
  height = 40,
  width = 1.6,
  fontSize = 12,
  displayValue = true,
  className = "",
}) {
  const modules = useMemo(() => {
    if (!value) return null;
    try {
      return encodeCode128(String(value));
    } catch {
      // Invalid characters for Code128 — fail quietly rather than crash the whole modal.
      return null;
    }
  }, [value]);

  if (!value) {
    return <p className="text-sm text-gray-400">Generated on assignment</p>;
  }
  if (!modules) return null;

  const svgWidth = modules.length * width + MARGIN * 2;
  const textHeight = displayValue ? TEXT_GAP + fontSize + 2 : 0;
  const svgHeight = MARGIN + height + textHeight + MARGIN;

  // Merge consecutive "1" modules into single bars
  const bars = [];
  let i = 0;
  while (i < modules.length) {
    if (modules[i] !== "1") {
      i += 1;
      continue;
    }
    let run = 1;
    while (i + run < modules.length && modules[i + run] === "1") run += 1;
    bars.push({ x: MARGIN + i * width, w: run * width });
    i += run;
  }

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-label={`Barcode ${value}`}
    >
      <g fill="#111827">
        {bars.map((b, idx) => (
          <rect key={idx} x={b.x} y={MARGIN} width={b.w} height={height} />
        ))}
      </g>
      {displayValue && (
        <text
          x={svgWidth / 2}
          y={MARGIN + height + TEXT_GAP + fontSize}
          textAnchor="middle"
          fontFamily="monospace"
          fontSize={fontSize}
          fill="#111827"
        >
          {String(value)}
        </text>
      )}
    </svg>
  );
}