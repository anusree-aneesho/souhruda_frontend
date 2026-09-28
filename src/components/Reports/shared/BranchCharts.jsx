// src/components/Reports/shared/BranchCharts.jsx
//
// Dependency-free charts (Tailwind + inline SVG) for the branch reports.
//   <BranchBarChart>  – one bar per branch, switchable metric
//   <DailyTrendChart> – totals across all branches, grouped by day / week / month
//                       (chosen automatically from the date span, overridable)
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

function ChartCard({ title, metrics, active, onChange, extra, children }) {
  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <div className="flex flex-wrap items-center gap-3">
          {extra}
          <MetricTabs metrics={metrics} value={active} onChange={onChange} />
        </div>
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

// ── Day / week / month grouping ─────────────────────────────
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const GRANULARITIES = [
  { key: "day", label: "Day", noun: "Daily", width: "w-8" },
  { key: "week", label: "Week", noun: "Weekly", width: "w-10" },
  { key: "month", label: "Month", noun: "Monthly", width: "w-14" },
  { key: "year", label: "Year", noun: "Yearly", width: "w-16" },
];
// Up to DAY_MAX_DAYS -> daily bars; up to WEEK_MAX_DAYS -> weekly; up to MONTH_MAX_DAYS -> monthly; beyond -> yearly.
const DAY_MAX_DAYS = 31;
const WEEK_MAX_DAYS = 120;
const MONTH_MAX_DAYS = 1095; // about 3 years

// Dates are handled as UTC "YYYY-MM-DD" strings so the browser timezone can never shift a day.
const parseIso = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const toIso = (dt) => dt.toISOString().slice(0, 10);
const addDays = (iso, n) => {
  const dt = parseIso(iso);
  dt.setUTCDate(dt.getUTCDate() + n);
  return toIso(dt);
};
const weekStart = (iso) => addDays(iso, -((parseIso(iso).getUTCDay() + 6) % 7)); // Monday
const monthStart = (iso) => `${String(iso).slice(0, 7)}-01`;
const yearStart = (iso) => `${String(iso).slice(0, 4)}-01-01`;
const shortDay = (iso) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
const monthLabel = (iso) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const spanDays = (first, last) => Math.round((parseIso(last) - parseIso(first)) / 86400000) + 1;

function GranularityToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-md border border-gray-200 p-0.5" role="group" aria-label="Group bars by">
      {GRANULARITIES.map((g) => (
        <button
          key={g.key}
          type="button"
          onClick={() => onChange(g.key)}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            value === g.key ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}

// Metrics that count people per day — summing days can count the same person twice.
const PEOPLE_METRICS = new Set(["patients", "male", "female"]);

/**
 * rows        – daily rows (need date); summed across branches, then grouped
 * metrics     – [{ key, label, currency? }]
 * formatLabel – formats a single day's label, e.g. formatRowDate
 * Grouping is automatic (day / week / month by date span); the toggle overrides it.
 */
export function DailyTrendChart({ title, rows, metrics, loading, formatLabel }) {
  const [activeKey, setActiveKey] = useState(metrics[0]?.key);
  const [override, setOverride] = useState(null);
  const metric = metrics.find((m) => m.key === activeKey) || metrics[0];

  // 1) total per date (all branches), oldest first
  const daily = useMemo(() => {
    const byDate = new Map();
    (rows || []).forEach((r) => {
      const d = String(r.date).slice(0, 10);
      byDate.set(d, (byDate.get(d) || 0) + (Number(r[metric.key]) || 0));
    });
    return [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([date, value]) => ({ date, value }));
  }, [rows, metric.key]);

  // 2) pick the grouping from the span the data covers
  const span = daily.length ? spanDays(daily[0].date, daily[daily.length - 1].date) : 0;
  const auto =
    span <= DAY_MAX_DAYS ? "day" : span <= WEEK_MAX_DAYS ? "week" : span <= MONTH_MAX_DAYS ? "month" : "year";
  const gran = GRANULARITIES.find((g) => g.key === (override || auto)) || GRANULARITIES[0];

  // 3) bucket into bars
  const points = useMemo(() => {
    if (gran.key === "day") {
      return daily.map((p) => ({ key: p.date, value: p.value, label: p.date }));
    }
    const buckets = new Map();
    daily.forEach((p) => {
      const start =
        gran.key === "week" ? weekStart(p.date) : gran.key === "month" ? monthStart(p.date) : yearStart(p.date);
      buckets.set(start, (buckets.get(start) || 0) + p.value);
    });
    return [...buckets.entries()].map(([start, value]) => ({
      key: start,
      value,
      label:
        gran.key === "week"
          ? `${shortDay(start)} – ${shortDay(addDays(start, 6))}`
          : gran.key === "month"
            ? monthLabel(start)
            : start.slice(0, 4),
    }));
  }, [daily, gran.key]);

  if (loading || points.length === 0) return null;

  const max = Math.max(1, ...points.map((p) => p.value));
  const labelOf = (p) => (gran.key === "day" ? (formatLabel ? formatLabel(p.label) : p.label) : p.label);

  return (
    <ChartCard
      title={title || `${gran.noun} Chart (all branches)`}
      metrics={metrics}
      active={metric.key}
      onChange={setActiveKey}
      extra={<GranularityToggle value={gran.key} onChange={setOverride} />}
    >
      <div className="flex items-start gap-2">
        <div className="text-[10px] text-gray-400 w-14 text-right shrink-0">{fmt(metric, max)}</div>
        <div className="flex-1 min-w-0 overflow-x-auto pb-1">
          <div className="flex gap-1" style={{ width: "max-content" }}>
            {points.map((p) => (
              <div
                key={p.key}
                className={`${gran.width} shrink-0 flex flex-col items-center`}
                title={`${labelOf(p)}: ${fmt(metric, p.value)}`}
              >
                <div className="w-full h-48 flex items-end border-b border-gray-200">
                  <div
                    className="w-full bg-teal-500 hover:bg-teal-600 rounded-t transition-colors"
                    style={{ height: `${(p.value / max) * 100}%`, minHeight: p.value > 0 ? "2px" : 0 }}
                  />
                </div>
                <div className="mt-1.5 text-[10px] leading-none text-gray-500 whitespace-nowrap [writing-mode:vertical-rl] rotate-180">
                  {labelOf(p)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {gran.key !== "day" && PEOPLE_METRICS.has(metric.key) && (
        <p className="mt-3 text-xs text-gray-400">
          Each bar adds up the daily counts, so a person seen on more than one day in the same {gran.key} is counted
          more than once.
        </p>
      )}
    </ChartCard>
  );
}

export const DailyBarChart = DailyTrendChart;