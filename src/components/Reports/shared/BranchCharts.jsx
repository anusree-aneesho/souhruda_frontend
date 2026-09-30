// src/components/Reports/shared/BranchCharts.jsx
//
// Dependency-free charts (Tailwind only) for the branch reports, both with
// labelled x / y axes, tick values and gridlines.
//   <BranchBarChart>  – one bar per branch, switchable metric
//   <DailyTrendChart> – totals across all branches, grouped by day / week / month / year
//                       (chosen automatically from the date span, overridable)
import { useState, useMemo } from "react";
import { formatCurrency } from "./format";

const fmt = (metric, v) => (metric.currency ? formatCurrency(v) : Number(v || 0).toLocaleString("en-IN"));

// ── Axis helpers ────────────────────────────────────────────
const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
const tickLabel = (metric, v) => (metric.currency ? `₹${compact.format(v)}` : compact.format(v));

// "Nice" axis scale: 0..niceMax in round steps (1 / 2 / 5 × 10ⁿ). Counts never get fractional ticks.
function niceScale(max, integerOnly, target = 4) {
  const rough = max / target;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const f = rough / pow;
  let step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
  if (integerOnly) step = Math.max(1, step);
  const niceMax = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = 0; v <= niceMax + step / 2; v += step) ticks.push(Number(v.toFixed(6)));
  return { niceMax, ticks };
}

function MetricTabs({ metrics, value, onChange }) {
  if (metrics.length < 2) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {metrics.map((m) => (
        <button
          key={m.key}
          type="button"
          onClick={() => onChange(m.key)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
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
 * Horizontal bars: x axis = metric value, y axis = branch.
 */
export function BranchBarChart({ title = "Branch Comparison", rows, metrics, loading }) {
  const [activeKey, setActiveKey] = useState(metrics[0]?.key);
  const metric = metrics.find((m) => m.key === activeKey) || metrics[0];

  if (loading || !rows?.length) return null;

  const max = Math.max(1, ...rows.map((r) => Number(r[metric.key]) || 0));
  const { niceMax, ticks } = niceScale(max, !metric.currency);
  const pct = (v) => `${(v / niceMax) * 100}%`;

  return (
    <ChartCard title={title} metrics={metrics} active={metric.key} onChange={setActiveKey}>
      <div className="text-[11px] text-gray-400 mb-2">Branch</div>

      <div className="relative">
        {/* vertical gridlines (the 0 line doubles as the y axis) */}
        <div className="absolute top-0 bottom-0 left-[9.75rem] sm:left-[13.75rem] right-[6.75rem] pointer-events-none">
          {ticks.map((t) => (
            <div
              key={t}
              className={`absolute top-0 bottom-0 border-l ${t === 0 ? "border-gray-300" : "border-gray-100"}`}
              style={{ left: pct(t) }}
            />
          ))}
        </div>

        <div className="relative space-y-3">
          {rows.map((r) => {
            const v = Number(r[metric.key]) || 0;
            return (
              <div key={r.branch_id} className="flex items-center gap-3">
                <div className="w-36 sm:w-52 shrink-0 text-xs text-gray-600 truncate" title={r.branch_name}>
                  {r.branch_name}
                </div>
                <div className="flex-1 h-5">
                  <div
                    className="h-5 bg-teal-500 rounded-r transition-all"
                    style={{ width: pct(v), minWidth: v > 0 ? "4px" : 0 }}
                  />
                </div>
                <div className="w-24 shrink-0 text-right text-xs font-medium text-gray-900">{fmt(metric, v)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* x axis */}
      <div className="flex items-start gap-3 mt-1">
        <div className="w-36 sm:w-52 shrink-0" />
        <div className="flex-1 relative h-6 border-t border-gray-300">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute top-1 -translate-x-1/2 text-[10px] text-gray-500"
              style={{ left: pct(t) }}
            >
              {tickLabel(metric, t)}
            </span>
          ))}
        </div>
        <div className="w-24 shrink-0" />
      </div>
      <div className="text-center text-[11px] text-gray-400 mt-1">{metric.label}</div>
    </ChartCard>
  );
}

// ── Day / week / month / year grouping ──────────────────────
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const GRANULARITIES = [
  { key: "day", label: "Day", noun: "Daily", axis: "Date", width: "w-8" },
  { key: "week", label: "Week", noun: "Weekly", axis: "Week", width: "w-10" },
  { key: "month", label: "Month", noun: "Monthly", axis: "Month", width: "w-14" },
  { key: "year", label: "Year", noun: "Yearly", axis: "Year", width: "w-16" },
];
// Up to DAY_MAX_DAYS -> daily bars; up to WEEK_MAX_DAYS -> weekly; up to MONTH_MAX_DAYS -> monthly; beyond -> yearly.
const DAY_MAX_DAYS = 31;
const WEEK_MAX_DAYS = 120;
const MONTH_MAX_DAYS = 1095; // about 3 years
const MAX_DAYS = 3660; // safety cap: never build more than ~10 years of days

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

function GranularityToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-md border border-gray-200 p-0.5" role="group" aria-label="Group bars by">
      {GRANULARITIES.map((g) => (
        <button
          key={g.key}
          type="button"
          onClick={() => onChange(g.key)}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
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
 * dateFrom / dateTo – the selected period; every day / week / month / year in it gets a bar
 * Vertical bars: x axis = date / week / month / year, y axis = metric value.
 */
export function DailyTrendChart({ title, rows, metrics, loading, formatLabel, dateFrom, dateTo }) {
  const [activeKey, setActiveKey] = useState(metrics[0]?.key);
  const [override, setOverride] = useState(null);
  const metric = metrics.find((m) => m.key === activeKey) || metrics[0];

  // 1) one entry for EVERY day of the selected period (0 when nothing happened),
  //    totalled across branches. Falls back to the data's own span if no period is given.
  const daily = useMemo(() => {
    const byDate = new Map();
    (rows || []).forEach((r) => {
      const d = String(r.date).slice(0, 10);
      byDate.set(d, (byDate.get(d) || 0) + (Number(r[metric.key]) || 0));
    });
    const dates = [...byDate.keys()].sort();
    const hasRange = dateFrom && dateTo && dateFrom <= dateTo;
    const start = hasRange ? String(dateFrom).slice(0, 10) : dates[0];
    const end = hasRange ? String(dateTo).slice(0, 10) : dates[dates.length - 1];
    if (!start || !end) return [];
    const days = [];
    for (let d = start, n = 0; d <= end && n < MAX_DAYS; d = addDays(d, 1), n += 1) {
      days.push({ date: d, value: byDate.get(d) || 0 });
    }
    return days;
  }, [rows, metric.key, dateFrom, dateTo]);

  // 2) pick the grouping from the span the data covers
  const span = daily.length;
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
  const { niceMax, ticks } = niceScale(max, !metric.currency);
  const pct = (v) => `${(v / niceMax) * 100}%`;
  const labelOf = (p) => (gran.key === "day" ? (formatLabel ? formatLabel(p.label) : p.label) : p.label);

  return (
    <ChartCard
      title={title || `${gran.noun} Chart (all branches)`}
      metrics={metrics}
      active={metric.key}
      onChange={setActiveKey}
      extra={<GranularityToggle value={gran.key} onChange={setOverride} />}
    >
      <div className="flex items-start gap-1">
        {/* y axis: title + tick values */}
        <div className="w-4 shrink-0 h-48 mt-2 flex items-center justify-center">
          <span className="text-[11px] text-gray-400 whitespace-nowrap [writing-mode:vertical-rl] rotate-180">
            {metric.label}
          </span>
        </div>
        <div className="relative w-12 shrink-0 h-48 mt-2 border-r border-gray-300">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-1.5 translate-y-1/2 text-[10px] leading-none text-gray-500"
              style={{ bottom: pct(t) }}
            >
              {tickLabel(metric, t)}
            </span>
          ))}
        </div>

        {/* plot area: horizontal gridlines + bars, scrolls sideways when there are many */}
        <div className="flex-1 min-w-0 overflow-x-auto pb-1 mt-2">
          <div className="relative" style={{ width: "max-content", minWidth: "100%" }}>
            <div className="absolute inset-x-0 top-0 h-48 pointer-events-none">
              {ticks.map(
                (t) =>
                  t > 0 && (
                    <div key={t} className="absolute inset-x-0 border-t border-gray-100" style={{ bottom: pct(t) }} />
                  ),
              )}
            </div>

            <div className="relative flex gap-1">
              {points.map((p) => (
                <div
                  key={p.key}
                  className={`${gran.width} shrink-0 flex flex-col items-center`}
                  title={`${labelOf(p)}: ${fmt(metric, p.value)}`}
                >
                  {/* bottom border = x axis line */}
                  <div className="w-full h-48 flex items-end border-b border-gray-300">
                    <div
                      className="w-full bg-teal-500 hover:bg-teal-600 rounded-t transition-colors"
                      style={{ height: pct(p.value), minHeight: p.value > 0 ? "2px" : 0 }}
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
      </div>

      {/* x axis title, aligned under the plot area */}
      <div className="pl-[4.5rem] text-center text-[11px] text-gray-400">{gran.axis}</div>

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