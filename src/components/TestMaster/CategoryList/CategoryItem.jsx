// src/components/TestMaster/CategoryList/CategoryItem.jsx
import { Trash2 } from "lucide-react";

const dotColors = {
  teal: "bg-teal-500",
  pink: "bg-pink-500",
  purple: "bg-purple-500",
  amber: "bg-amber-500",
};

export default function CategoryItem({ id, name, count, color, isActive, onClick, onDelete, canManage }) {
  return (
    <div
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
        isActive ? "bg-teal-50 text-teal-700" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <button onClick={onClick} className="flex items-center gap-2 flex-1 text-left cursor-pointer">
        <span className={`h-2 w-2 rounded-full ${dotColors[color]}`} />
        {name}
      </button>
      <div className="flex items-center gap-2">
        {canManage && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete({ id, name });
            }}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity cursor-pointer"
            title="Delete category"
          >
            <Trash2 size={13} />
          </button>
        )}
        <span className="text-xs text-gray-400">{count}</span>
      </div>
    </div>
  );
}