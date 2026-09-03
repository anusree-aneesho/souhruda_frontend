// src/components/HomeCollection/DetailModal/TrackingMap.jsx
export default function TrackingMap() {
  return (
    <div className="relative h-40 rounded-lg bg-gray-100 overflow-hidden">
      <svg viewBox="0 0 400 160" className="w-full h-full">
        <line x1="60" y1="120" x2="330" y2="30" stroke="#0f9c8f" strokeWidth="2" strokeDasharray="6 5" />
        <circle cx="60" cy="120" r="7" fill="#3b82f6" />
        <circle cx="330" cy="30" r="7" fill="#3b82f6" />
        <circle cx="180" cy="80" r="6" fill="#0f9c8f" />
      </svg>
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-8 bg-white text-[11px] px-2 py-1 rounded-md shadow text-gray-600 whitespace-nowrap">
        Technician (live, simulated)
      </span>
    </div>
  );
}