// src/components/Statistics/OrdersTrendSection.jsx
import { useState, useEffect } from "react";

const rangeOptions = ["Today", "Yesterday", "1 Week", "1 Month", "1 Year"];

function RangeFilter({ options = rangeOptions, active, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
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

function TrendCard({ title, range, onRangeChange }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <a href="#" className="text-xs text-teal-600 font-medium hover:underline">View Report</a>
      </div>
      <div className="h-40 rounded-lg bg-gray-50 flex items-center justify-center text-xs text-gray-400">
        Chart placeholder
      </div>
      <RangeFilter active={range} onChange={onRangeChange} />
    </div>
  );
}

function DonutCard({ title, total, segments }) {
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
    </div>
  );
}

export default function OrdersTrendSection() {
  const [ordersRange, setOrdersRange] = useState("1 Year");
  const [revenueRange, setRevenueRange] = useState("1 Year");
  const [statusData, setStatusData] = useState({
    total: 0,
    segments: [],
  });

  useEffect(() => {
    // TODO: replace with real API call, e.g. getOrdersOverTimeApi(ordersRange)
  }, [ordersRange]);

  useEffect(() => {
    // TODO: replace with real API call, e.g. getRevenueOverTimeApi(revenueRange)
  }, [revenueRange]);

  useEffect(() => {
    // TODO: replace with real API call, e.g. getOrderStatusDistributionApi()
    setStatusData({
      total: 733,
      segments: [
        { label: "Completed", pct: 65.2, count: 478, colorHex: "#22c55e" },
        { label: "Pending", pct: 12.6, count: 92, colorHex: "#fbbf24" },
        { label: "Cancelled", pct: 22.2, count: 163, colorHex: "#f87171" },
      ],
    });
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <TrendCard title="Orders Over Time" range={ordersRange} onRangeChange={setOrdersRange} />
      <TrendCard title="Revenue Over Time (₹)" range={revenueRange} onRangeChange={setRevenueRange} />
      <DonutCard title="Order Status Distribution" total={statusData.total} segments={statusData.segments} />
    </div>
  );
}