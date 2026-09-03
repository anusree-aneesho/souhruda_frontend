// src/components/common/StatCard.jsx
export default function StatCard({ label, value, sublabel, icon: Icon, color }) {
  const colorMap = {
    teal: "bg-teal-600",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    gray: "bg-gray-400",
    green: "bg-green-500",
  };
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
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