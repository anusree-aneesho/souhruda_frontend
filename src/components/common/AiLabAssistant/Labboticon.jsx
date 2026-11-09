// src/components/common/LabAssistant/LabBotIcon.jsx
// AI assistant icon: the modern "sparkles" mark (one large star + two small ones).
// Solid fill using currentColor, so it takes the text colour of wherever it is placed.
const STAR =
  "M12 3C12.6 8.4 15.6 11.4 21 12C15.6 12.6 12.6 15.6 12 21C11.4 15.6 8.4 12.6 3 12C8.4 11.4 11.4 8.4 12 3Z";

export default function LabBotIcon({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path transform="translate(-2,3.5) scale(0.75)" d={STAR} />
      <path transform="translate(12.5,-0.5) scale(0.4)" d={STAR} />
      <path transform="translate(15,12.5) scale(0.3)" d={STAR} />
    </svg>
  );
}