// src/components/common/StatCard.jsx
export default function StatCard({ label, value, sublabel, icon: Icon, color, onClick, active = false }) {
  const colorMap = {
    teal: "bg-teal-600",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    gray: "bg-gray-400",
    green: "bg-green-500",
  };

  const ringMap = {
    teal: "ring-teal-500",
    amber: "ring-amber-500",
    blue: "ring-blue-500",
    purple: "ring-purple-500",
    gray: "ring-gray-400",
    green: "ring-green-500",
  };

  const isClickable = typeof onClick === "function";

  return (
    <div
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}
      className={`bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${
        isClickable ? "cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300" : ""
      } ${active ? `ring-2 ring-offset-2 ${ringMap[color]}` : ""}`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <span className={`h-8 w-8 rounded-md flex items-center justify-center text-white shrink-0 ${colorMap[color]}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
    </div>
  );
}