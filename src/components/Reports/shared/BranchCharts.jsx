// src/components/Reports/shared/BranchCharts.jsx
//
// Dependency-free charts (Tailwind + inline SVG) for the branch reports.
//   <BranchBarChart>  – one bar per branch, switchable metric
//   <DailyTrendChart> – daily totals across all branches, switchable metric
import { useState, useMemo } from "react";
import { formatCurrency } from "./format";

const fmt = (metric, v) => (metric.currency ? formatCurrency(v) : Number(v || 0).toLocaleString("en-IN"));

function MetricTabs({ metrics, value, onChange }) {
  if (metrics.length < 2) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {metrics.map((m) => (
        <button
          key={m.key}
          type="button"
          onClick={() => onChange(m.key)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            value === m.key ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

function ChartCard({ title, metrics, active, onChange, children }) {
  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <MetricTabs metrics={metrics} value={active} onChange={onChange} />
      </div>
      {children}
    </div>
  );
}

/**
 * rows    – branch rows (need branch_id, branch_name)
 * metrics – [{ key, label, currency? }]
 */
export function BranchBarChart({ title = "Branch Comparison", rows, metrics, loading }) {
  const [activeKey, setActiveKey] = useState(metrics[0]?.key);
  const metric = metrics.find((m) => m.key === activeKey) || metrics[0];

  if (loading || !rows?.length) return null;

  const max = Math.max(1, ...rows.map((r) => Number(r[metric.key]) || 0));

  return (
    <ChartCard title={title} metrics={metrics} active={metric.key} onChange={setActiveKey}>
      <div className="space-y-3">
        {rows.map((r) => {
          const v = Number(r[metric.key]) || 0;
          return (
            <div key={r.branch_id} className="flex items-center gap-3">
              <div className="w-36 sm:w-52 text-xs text-gray-600 truncate" title={r.branch_name}>
                {r.branch_name}
              </div>
              <div className="flex-1 h-5 bg-gray-50 rounded">
                <div
                  className="h-5 bg-teal-500 rounded transition-all"
                  style={{ width: `${(v / max) * 100}%`, minWidth: v > 0 ? "4px" : 0 }}
                />
              </div>
              <div className="w-24 text-right text-xs font-medium text-gray-900">{fmt(metric, v)}</div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

/**
 * rows        – daily rows (need date); summed across branches per date
 * metrics     – [{ key, label, currency? }]
 * formatLabel – e.g. formatRowDate
 */
export function DailyTrendChart({ title = "Day-wise Chart (all branches)", rows, metrics, loading, formatLabel }) {
  const [activeKey, setActiveKey] = useState(metrics[0]?.key);
  const metric = metrics.find((m) => m.key === activeKey) || metrics[0];

  const points = useMemo(() => {
    const byDate = new Map();
    (rows || []).forEach((r) => {
      byDate.set(r.date, (byDate.get(r.date) || 0) + (Number(r[metric.key]) || 0));
    });
    return [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([date, value]) => ({ date, value }));
  }, [rows, metric.key]);

  if (loading || points.length === 0) return null;

  const max = Math.max(1, ...points.map((p) => p.value));
  const label = (d) => (formatLabel ? formatLabel(d) : d);

  return (
    <ChartCard title={title} metrics={metrics} active={metric.key} onChange={setActiveKey}>
      <div className="flex items-start gap-2">
        <div className="text-[10px] text-gray-400 w-14 text-right shrink-0">{fmt(metric, max)}</div>
        <div className="flex-1 min-w-0 overflow-x-auto pb-1">
          <div className="flex gap-1" style={{ minWidth: `${points.length * 28}px` }}>
            {points.map((p) => (
              <div
                key={p.date}
                className="flex-1 flex flex-col items-center"
                title={`${label(p.date)}: ${fmt(metric, p.value)}`}
              >
                <div className="w-full h-48 flex items-end border-b border-gray-200">
                  <div
                    className="w-full bg-teal-500 hover:bg-teal-600 rounded-t transition-colors"
                    style={{ height: `${(p.value / max) * 100}%`, minHeight: p.value > 0 ? "2px" : 0 }}
                  />
                </div>
                <div className="mt-1.5 text-[10px] leading-none text-gray-500 whitespace-nowrap [writing-mode:vertical-rl] rotate-180">
                  {label(p.date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

export const DailyBarChart = DailyTrendChart;