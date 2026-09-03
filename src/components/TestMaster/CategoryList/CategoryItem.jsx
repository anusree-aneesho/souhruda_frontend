// src/components/TestMaster/CategoryList/CategoryItem.jsx
const dotColors = {
  teal: "bg-teal-500",
  pink: "bg-pink-500",
  purple: "bg-purple-500",
  amber: "bg-amber-500",
};

export default function CategoryItem({ name, count, color, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive ? "bg-teal-50 text-teal-700" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotColors[color]}`} />
        {name}
      </span>
      <span className="text-xs text-gray-400">{count}</span>
    </button>
  );
}