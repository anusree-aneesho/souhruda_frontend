// src/components/common/Barcode.jsx
//
// SCRUM-141: renders a real, scannable Code128 barcode (not just the text
// value). Uses jsbarcode against an <svg> ref so it scales cleanly for both
// on-screen display and print labels.
import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export default function Barcode({
  value,
  height = 40,
  width = 1.6,
  fontSize = 12,
  displayValue = true,
  className = "",
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        height,
        width,
        fontSize,
        displayValue,
        margin: 4,
        background: "transparent",
        lineColor: "#111827",
      });
    } catch {
      // Invalid characters for the chosen barcode symbology — fail quietly
      // and leave the (empty) svg rather than crash the whole modal.
    }
  }, [value, height, width, fontSize, displayValue]);

  if (!value) {
    return <p className="text-sm text-gray-400">Generated on assignment</p>;
  }

  return <svg ref={svgRef} className={className} role="img" aria-label={`Barcode ${value}`} />;
}