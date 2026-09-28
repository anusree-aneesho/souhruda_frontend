// src/components/Reports/ReportItemGrid.jsx
import { ArrowRight } from "lucide-react";

// Tailwind needs static, literal class names to keep them in the build, so
// this maps item counts to a whole class string rather than interpolating
// `lg:grid-cols-${n}`. Counts above 6 fall back to a 6-wide grid and wrap.
const LG_COLS_BY_COUNT = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

export default function ReportItemGrid({ category, onSelect }) {
  const lgCols = LG_COLS_BY_COUNT[category.items.length] || "lg:grid-cols-6";

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${lgCols} gap-4`}>
      {category.items.map(({ key, title, description, icon: Icon, component }) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className="group text-left bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-transparent hover:border-teal-100 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500"
        >
          <div className="flex items-start justify-between">
            <span className={`inline-flex h-10 w-10 rounded-lg items-center justify-center mb-3 ${category.color}`}>
              <Icon size={18} />
            </span>
            {!component && (
              <span className="text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5 mt-1">
                Coming soon
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
              {title}
            </h3>
            {component && (
              <ArrowRight
                size={14}
                className="text-gray-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0"
              />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </button>
      ))}
    </div>
  );
}