// src/components/Statistics/OrdersTrendSection.jsx
import { useState, useEffect } from "react";
import {
  getOrderStatusDistributionApi,
  getOrdersOverTimeApi,
  getRevenueOverTimeApi,
} from "../../api/api";
import MiniBarChart from "../Reports/shared/MiniBarChart";

const ALL_RANGES = ["Today", "Yesterday", "1 Week", "1 Month", "1 Year"];

function RangeFilter({ active, onChange }) {
  const options = active === "Today" ? ALL_RANGES.filter((r) => r !== "Today") : ALL_RANGES;

  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          // Adjust size here: px-2 py-1 text-[11px] (small) →
          // px-3 py-1.5 text-xs (original/larger)
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer whitespace-nowrap ${
            r === active
              ? "bg-teal-600 text-white"
              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function TrendCard({ title, range, onRangeChange, chartData, loading, formatValue }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <a href="#" className="text-xs text-teal-600 font-medium hover:underline">View Report</a>
      </div>

      {loading ? (
        <div className="h-40 rounded-lg bg-gray-50 flex items-center justify-center text-xs text-gray-400">
          Loading…
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-40 rounded-lg bg-gray-50 flex items-center justify-center text-xs text-gray-400">
          No data for this range.
        </div>
      ) : (
        <MiniBarChart data={chartData} labelKey="label" valueKey="value" formatValue={formatValue} />
      )}

      <RangeFilter active={range} onChange={onRangeChange} />
    </div>
  );
}

function DonutCard({ title, total, segments, range, onRangeChange, loading }) {
  let cumulative = 0;
  const gradientParts = segments.map((s) => {
    const start = cumulative;
    cumulative += s.pct;
    return `${s.colorHex} ${start}% ${cumulative}%`;
  });

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <a href="#" className="text-xs text-teal-600 font-medium hover:underline">View Report</a>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 text-center py-6">Loading…</p>
      ) : (
        <div className="flex items-center gap-6">
          <div
            className="relative w-28 h-28 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `conic-gradient(${gradientParts.join(", ")})` }}
          >
            <div className="w-16 h-16 rounded-full bg-white flex flex-col items-center justify-center">
              <span className="text-[10px] text-gray-400">Total</span>
              <span className="text-sm font-bold text-gray-900">{total}</span>
            </div>
          </div>
          <div className="space-y-2 flex-1">
            {segments.map((s) => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.colorHex }} />
                  {s.label}
                </span>
                <span className="text-gray-900 font-medium">{s.pct}% ({s.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {onRangeChange && <RangeFilter active={range} onChange={onRangeChange} />}
    </div>
  );
}

// Converts the {labels, values} shape the API returns into MiniBarChart's
// expected [{label, value}] array.
function toChartData(res) {
  const labels = res?.labels ?? [];
  const values = res?.values ?? [];
  return labels.map((label, i) => ({ label, value: Number(values[i]) || 0 }));
}

export default function OrdersTrendSection() {
  const [ordersRange, setOrdersRange] = useState("Today");
  const [revenueRange, setRevenueRange] = useState("Today");
  const [statusRange, setStatusRange] = useState("Today");

  const [ordersData, setOrdersData] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  const [revenueData, setRevenueData] = useState([]);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState(null);

  const [statusData, setStatusData] = useState({ total: 0, segments: [] });
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError(null);

    getOrdersOverTimeApi(ordersRange)
      .then((res) => {
        if (!cancelled) setOrdersData(toChartData(res));
      })
      .catch((err) => {
        if (!cancelled) setOrdersError(err.message);
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ordersRange]);

  useEffect(() => {
    let cancelled = false;
    setRevenueLoading(true);
    setRevenueError(null);

    getRevenueOverTimeApi(revenueRange)
      .then((res) => {
        if (!cancelled) setRevenueData(toChartData(res));
      })
      .catch((err) => {
        if (!cancelled) setRevenueError(err.message);
      })
      .finally(() => {
        if (!cancelled) setRevenueLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [revenueRange]);

  useEffect(() => {
    let cancelled = false;
    setStatusLoading(true);
    setStatusError(null);

    getOrderStatusDistributionApi(statusRange)
      .then((res) => {
        if (!cancelled) {
          setStatusData({ total: res.total ?? 0, segments: res.segments ?? [] });
        }
      })
      .catch((err) => {
        if (!cancelled) setStatusError(err.message);
      })
      .finally(() => {
        if (!cancelled) setStatusLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [statusRange]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <TrendCard
        title="Orders Over Time"
        range={ordersRange}
        onRangeChange={setOrdersRange}
        chartData={ordersData}
        loading={ordersLoading}
      />
      <TrendCard
        title="Revenue Over Time (₹)"
        range={revenueRange}
        onRangeChange={setRevenueRange}
        chartData={revenueData}
        loading={revenueLoading}
        formatValue={(v) => `₹${v.toLocaleString("en-IN")}`}
      />
      <DonutCard
        title="Order Status Distribution"
        total={statusData.total}
        segments={statusData.segments}
        range={statusRange}
        onRangeChange={setStatusRange}
        loading={statusLoading}
      />

      {(ordersError || revenueError || statusError) && (
        <p className="text-xs text-red-500 col-span-full">
          {ordersError && `Orders: ${ordersError}. `}
          {revenueError && `Revenue: ${revenueError}. `}
          {statusError && `Status: ${statusError}.`}
        </p>
      )}
    </div>
  );
}