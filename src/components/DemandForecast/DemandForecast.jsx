// src/components/DemandForecast/DemandForecast.jsx
// Demand Forecast (admin / super admin only): expected lab orders for the next days.
// All numbers come from the AI service; this page only shows them. The server decides which
// branch a user may see, so the branch picker is just a filter and hides itself for admins.
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardList, Info, TrendingUp } from "lucide-react";
import StatCard from "../common/StatCard";
import { getDemandForecastApi, getForecastBranchesApi } from "../../api/insightsApi";

const HORIZONS = [7, 14];
const CHART_HEIGHT = 140; // px of the bar area

// "2026-10-30" -> { wd: "Fri", day: "30", label: "Fri, 30 Oct" } (no time-zone shifting)
function parts(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const wd = dt.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
  const mon = dt.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  return { wd, day: String(d), label: `${wd}, ${d} ${mon}` };
}

const STATUS_STYLE = {
  ok: {
    box: "bg-teal-50 border-teal-100 text-teal-800",
    title: "Forecast ready",
    Icon: CheckCircle2,
  },
  low_confidence: {
    box: "bg-amber-50 border-amber-100 text-amber-800",
    title: "Low confidence",
    Icon: AlertTriangle,
  },
  insufficient_history: {
    box: "bg-amber-50 border-amber-100 text-amber-800",
    title: "Not enough history",
    Icon: Info,
  },
};

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${className}`}>
      {children}
    </div>
  );
}

function ForecastChart({ history, forecast, rangeLabel }) {
  const columns = [
    ...history.map((h) => ({ kind: "past", date: h.date, value: h.orders })),
    ...forecast.map((f, i) => ({
      kind: "future",
      date: f.date,
      value: f.expected,
      low: f.low,
      high: f.high,
      today: i === 0,
    })),
  ];
  const max = Math.max(1, ...columns.map((c) => Math.max(c.value, c.high ?? 0)));
  const px = (n) => Math.round((n / max) * CHART_HEIGHT);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1.5 min-w-[520px] pt-2">
        {columns.map((c) => {
          const p = parts(c.date);
          const h = c.value > 0 ? Math.max(4, px(c.value)) : 2;
          return (
            <div
              key={c.date}
              className={`flex-1 min-w-0 flex flex-col items-center gap-1 ${
                c.today ? "border-l border-dashed border-gray-300 pl-1.5 ml-1" : ""
              }`}
            >
              <span className="text-[11px] text-gray-500 h-4">{c.value}</span>
              <div
                className="relative w-full flex items-end justify-center"
                style={{ height: `${CHART_HEIGHT}px` }}
              >
                <div
                  className={`w-full max-w-[26px] rounded-t-md ${
                    c.kind === "past" ? "bg-teal-500" : "bg-teal-200"
                  } ${c.value === 0 ? "opacity-40" : ""}`}
                  style={{ height: `${h}px` }}
                  title={
                    c.kind === "past"
                      ? `${p.label}: ${c.value} orders`
                      : `${p.label}: about ${c.value} (range ${c.low}–${c.high})`
                  }
                />
                {c.kind === "future" && c.high > c.low && (
                  <div
                    className="absolute w-0.5 bg-teal-700/60 rounded"
                    style={{ bottom: `${px(c.low)}px`, height: `${Math.max(2, px(c.high) - px(c.low))}px` }}
                  />
                )}
              </div>
              <span className="text-[11px] text-gray-500 leading-none">{p.wd}</span>
              <span className="text-[10px] text-gray-400 leading-none">
                {c.today ? "Today" : p.day}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-4 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-teal-500" /> Past orders
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-teal-200" /> Expected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-0.5 h-3 bg-teal-700/60 rounded" /> {rangeLabel}
        </span>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-white animate-pulse" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-white animate-pulse" />
    </div>
  );
}

export default function DemandForecast() {
  const [horizon, setHorizon] = useState(7);
  const [branchId, setBranchId] = useState(""); // "" = let the server pick (all branches / own branch)
  const [branches, setBranches] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);
  // The request this result belongs to; while it differs from the wanted one we are loading.
  const [result, setResult] = useState({ key: null, data: null, error: "" });

  const key = `${horizon}:${branchId}`;
  const loading = result.key !== key;

  useEffect(() => {
    const ctrl = new AbortController();
    getForecastBranchesApi({ signal: ctrl.signal })
      .then(setBranches)
      .catch(() => {}); // the forecast request below shows any real error
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    getDemandForecastApi({ horizon, branchId: branchId || undefined }, { signal: ctrl.signal })
      .then((data) => setResult({ key, data, error: "" }))
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setResult({ key, data: null, error: err?.message || "Failed to load the forecast" });
      });
    return () => ctrl.abort();
  }, [horizon, branchId, key, reloadTick]);

  const data = !loading ? result.data : null;
  const error = !loading ? result.error : "";
  const style = data ? STATUS_STYLE[data.status] : null;

  const busiest = data?.forecast?.length
    ? data.forecast.reduce((best, d) => (d.expected > best.expected ? d : best), data.forecast[0])
    : null;

  const canPick = branches?.can_view_all && branches.branches.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demand Forecast</h1>
          <p className="text-sm text-gray-500 mt-1">
            Expected lab orders per day, estimated from past orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canPick ? (
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-white border border-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label="Branch"
            >
              <option value="">All branches ({branches.branches.length})</option>
              {branches.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : (
            data?.scope?.branch_name && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-50 text-teal-700">
                {data.scope.branch_name}
              </span>
            )
          )}

          <div className="flex gap-1.5">
            {HORIZONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setHorizon(n)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                  n === horizon
                    ? "bg-teal-600 text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Next {n} days
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <Skeleton />}

      {!loading && error && (
        <Card>
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => {
              setResult({ key: null, data: null, error: "" });
              setReloadTick((n) => n + 1);
            }}
            className="mt-2 text-xs font-medium text-teal-700 hover:underline cursor-pointer"
          >
            Retry
          </button>
        </Card>
      )}

      {data && (
        <>
          <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${style.box}`}>
            <style.Icon size={18} className="mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">{style.title}</p>
              <p className="mt-0.5">{data.message}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label={`Expected orders, next ${data.forecast.length || horizon} days`}
              value={data.total_expected ?? "—"}
              sublabel={data.total_expected == null ? "Needs more history" : "Starting today"}
              icon={TrendingUp}
              color="teal"
            />
            <StatCard
              label="Busiest expected day"
              value={busiest && busiest.expected > 0 ? busiest.weekday : "—"}
              sublabel={
                busiest && busiest.expected > 0
                  ? `About ${busiest.expected} ${busiest.expected === 1 ? "order" : "orders"}`
                  : "No busy day expected"
              }
              icon={CalendarDays}
              color="blue"
            />
            <StatCard
              label="Based on"
              value={`${data.basis.orders_used} ${data.basis.orders_used === 1 ? "order" : "orders"}`}
              sublabel={`Over ${data.basis.observed_days} days, ${data.basis.active_days} with orders`}
              icon={ClipboardList}
              color="purple"
            />
          </div>

          <Card className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Past orders and forecast</h3>
              <span className="text-xs text-gray-400">
                {data.scope.mode === "all_branches"
                  ? `All branches (${data.scope.branch_count})`
                  : data.scope.branch_name}
              </span>
            </div>
            {data.basis.orders_used > 0 || data.forecast.length > 0 ? (
              <ForecastChart history={data.history} forecast={data.forecast} rangeLabel={data.basis.range_label}/>
            ) : (
              <p className="text-sm text-gray-500 py-10 text-center">
                No orders to show yet for this selection.
              </p>
            )}
          </Card>

          {data.forecast.length > 0 && (
            <Card className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Daily forecast</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 bg-gray-50">
                      <th className="px-3 py-2 font-bold">Date</th>
                      <th className="px-3 py-2 font-bold text-right">Expected orders</th>
                      <th className="px-3 py-2 font-bold text-right">Likely range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.forecast.map((d, i) => (
                      <tr key={d.date} className="border-t border-gray-100 hover:bg-teal-50/40">
                        <td className="px-3 py-2 text-gray-800">
                          {parts(d.date).label}
                          {i === 0 && (
                            <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700">
                              Today
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900">{d.expected}</td>
                        <td className="px-3 py-2 text-right text-gray-500">
                          {d.low} – {d.high}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card className="text-xs text-gray-500 space-y-1.5">
            <p className="font-semibold text-gray-700 text-sm">How this is worked out</p>
            <p>
              {data.basis.method_summary} Based on the last {data.basis.lookback_days} days; days with no
              orders count as zero.
            </p>
            <p>
              Cancelled and deleted orders are not counted. Today is shown as a forecast because the day
              is not finished yet.
            </p>
            {data.basis.orders_left_out_no_branch > 0 && (
              <p>
                {data.basis.orders_left_out_no_branch} recent orders have no branch recorded, so they are
                not included in any branch.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}