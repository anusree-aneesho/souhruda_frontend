// src/components/Reports/shared/MiniBarChart.jsx

// Plain CSS bar chart — this project doesn't have Chart.js/Recharts
// installed, so this keeps the reports dependency-free.
export default function MiniBarChart({ data, labelKey, valueKey, formatValue }) {
  const max = Math.max(1, ...data.map((d) => d[valueKey] || 0));

  return (
    <div className="flex items-end gap-2 h-40 pt-4">
      {data.map((d, i) => {
        const value = d[valueKey] || 0;
        const heightPct = Math.max(2, Math.round((value / max) * 100));

        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <span className="text-[11px] text-gray-500 truncate w-full text-center">
              {formatValue ? formatValue(value) : value}
            </span>
            <div className="w-full flex items-end justify-center" style={{ height: "100px" }}>
              <div
                className="w-full max-w-[28px] rounded-t-md bg-teal-500"
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-[11px] text-gray-400 truncate w-full text-center">
              {d[labelKey]}
            </span>
          </div>
        );
      })}
    </div>
  );
}