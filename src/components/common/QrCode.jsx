// src/components/common/QrCode.jsx
//
// SCRUM-142: real QR code rendering (SVG, scannable) for sample labels —
// lets lab-processing staff scan straight to the collection record instead
// of typing in the hc_code by hand.
import { QRCodeSVG } from "qrcode.react";

export default function QrCode({ value, size = 96, className = "" }) {
  if (!value) return null;

  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="M"
      marginSize={2}
      className={className}
    />
  );
}