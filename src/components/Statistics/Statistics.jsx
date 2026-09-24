import { useState, useEffect } from "react";
import { getOrdersForRangeApi } from "../../api/api";
import {
  Briefcase,
  IndianRupee,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Calendar,
  BadgeIndianRupee,
  LineChart,
  AlertTriangle,
} from "lucide-react";
import { getStatisticsSummaryApi } from "../../api/api";

const rangeOptions = ["Today", "Yesterday", "1 Week", "1 Month", "1 Year"];

function StatCard({ label, value, icon: Icon, bg, color }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon size={16} className={color} />
        </div>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function RangeFilter({ options = rangeOptions, active, onSelect, showToday = true }) {
  const visibleOptions = showToday
    ? options
    : options.filter((r) => r !== "Today");

  return (
    <div className="flex gap-2 flex-wrap">
      {visibleOptions.map((r) => (
        <button
          key={r}
          onClick={() => onSelect(r)}
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

function HighlightCard({
  label,
  value,
  icon: Icon,
  bg,
  color,
  options,
  active,
  onSelect,
  showToday,
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon size={16} className={color} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <RangeFilter
        options={options}
        active={active}
        onSelect={onSelect}
        showToday={showToday}
      />
    </div>
  );
}

function TrendCard({ title }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <a href="#" className="text-xs text-teal-600 font-medium hover:underline">View Report</a>
      </div>
      <div className="h-40 rounded-lg bg-gray-50 flex items-center justify-center text-xs text-gray-400">
        Chart placeholder
      </div>
      <RangeFilter />
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

function RankedList({ title, rows, unit = "" }) {
  const max = Math.max(...rows.map((r) => r.count));
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <a href="#" className="text-xs text-teal-600 font-medium hover:underline">View All</a>
      </div>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 text-xs">
            <span className="w-28 shrink-0 text-gray-600 truncate">{r.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-500"
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </div>
            <span className="w-10 text-right text-gray-900 font-medium">{r.count}{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Statistics() {
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getStatisticsSummaryApi();
        if (!cancelled) setSummary(res);
      } catch (err) {
        if (!cancelled) setSummaryError(err.message || "Couldn't load order statistics.");
        console.error("Failed to load statistics summary:", err.message);
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rangeKeyMap = {
    Today: "today",
    Yesterday: "yesterday",
    "1 Week": "week",
    "1 Month": "month",
    "1 Year": "year",
  };

  const [ordersRange, setOrdersRange] = useState(null);
  const [hasSwitchedRange, setHasSwitchedRange] = useState(false);
  const [ordersRangeCount, setOrdersRangeCount] = useState(null);
  const [ordersRangeLoading, setOrdersRangeLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setOrdersRangeLoading(true);
    (async () => {
      try {
        const res = await getOrdersForRangeApi(rangeKeyMap[ordersRange]);
        if (!cancelled) setOrdersRangeCount(res.count);
      } catch (err) {
        console.error("Failed to load orders for range:", err.message);
      } finally {
        if (!cancelled) setOrdersRangeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ordersRange]);

  // Row 1 — Total/Completed/Pending/Cancelled come from the API now.
  // Total Revenue and Average Order Value stay hardcoded until wired up separately.
  const statCards = [
    {
      label: "Total Orders",
      value: summaryLoading ? "…" : (summary?.totalOrders ?? 0).toLocaleString(),
      icon: Briefcase,
      bg: "bg-blue-50",
      color: "text-blue-600",
    },
    { label: "Total Revenue", value: "₹15,12,295.93", icon: IndianRupee, bg: "bg-green-50", color: "text-green-600" },
    {
      label: "Completed Orders",
      value: summaryLoading ? "…" : (summary?.completedOrders ?? 0).toLocaleString(),
      icon: CheckCircle2,
      bg: "bg-purple-50",
      color: "text-purple-600",
    },
    {
      label: "Pending Orders",
      value: summaryLoading ? "…" : (summary?.pendingOrders ?? 0).toLocaleString(),
      icon: Clock,
      bg: "bg-amber-50",
      color: "text-amber-600",
    },
    {
      label: "Cancelled Orders",
      value: summaryLoading ? "…" : (summary?.cancelledOrders ?? 0).toLocaleString(),
      icon: XCircle,
      bg: "bg-red-50",
      color: "text-red-600",
    },
    { label: "Average Order Value", value: "₹1,497.32", icon: TrendingUp, bg: "bg-teal-50", color: "text-teal-600" },
  ];

  const topDoctors = [
    { label: "Self", count: 890 },
    { label: "Dr.geethu", count: 42 },
    { label: "Dr.asdf", count: 28 },
  ];
  const topTests = [
    { label: "Fasting Blood Sugar", count: 290 },
    { label: "Total Protein", count: 271 },
    { label: "Creatinine", count: 131 },
    { label: "CBC", count: 91 },
  ];
  const topCategories = [
    { label: "Biochemistry", count: 374 },
    { label: "Hematology", count: 209 },
    { label: "Hormone", count: 190 },
  ];

  const statusSegments = [
    { label: "Completed", pct: 65.2, count: 478, colorHex: "#22c55e" },
    { label: "Pending", pct: 12.6, count: 92, colorHex: "#fbbf24" },
    { label: "Cancelled", pct: 22.2, count: 163, colorHex: "#f87171" },
  ];

  const collectionSegments = [
    { label: "Walk-in", pct: 72.6, count: 733, colorHex: "#0d9488" },
    { label: "Home Collection", pct: 27.4, count: 277, colorHex: "#a78bfa" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
          <p className="text-sm text-gray-500 mt-1">Lab performance overview.</p>
        </div>
        <button className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer">
          Export
        </button>
      </div>

      {summaryError && (
        <p className="text-sm text-red-500">{summaryError}</p>
      )}

      {/* Row 1 — top-level totals */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* Row 2 — highlight cards with their own range filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HighlightCard
          label="Today's Orders"
          value={ordersRangeLoading ? "…" : (ordersRangeCount ?? 0).toLocaleString()}
          icon={Calendar}
          bg="bg-blue-50"
          color="text-blue-600"
          options={rangeOptions}
          active={ordersRange}
          onSelect={(r) => {
            setOrdersRange(r);
            setHasSwitchedRange(true);
          }}
          showToday={hasSwitchedRange}
        />
        <HighlightCard
          label="Today's Revenue"
          value="₹0.00"
          icon={BadgeIndianRupee}
          bg="bg-green-50"
          color="text-green-600"
          options={rangeOptions.slice(1)}
        />
        <HighlightCard
          label="Today's Average Order Value"
          value="₹0.00"
          icon={LineChart}
          bg="bg-teal-50"
          color="text-teal-600"
          options={rangeOptions.slice(1)}
        />
      </div>

      {/* Row 3 — trends + status donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TrendCard title="Orders Over Time" />
        <TrendCard title="Revenue Over Time (₹)" />
        <DonutCard title="Order Status Distribution" total={733} segments={statusSegments} />
      </div>

      {/* Row 4 — ranked lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RankedList title="Top Referring Doctors" rows={topDoctors} />
        <RankedList title="Most Ordered Tests" rows={topTests} />
        <RankedList title="Top Test Categories" rows={topCategories} />
      </div>

      {/* Row 5 — collection type donut + a lab-specific alert card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DonutCard title="Walk-in vs Home Collection" total={1010} segments={collectionSegments} />

        <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Attention Needed</h3>
            <a href="#" className="text-xs text-teal-600 font-medium hover:underline">View All</a>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} className="text-red-500" />
              </div>
              <span className="text-gray-600 flex-1">Critical results flagged today</span>
              <span className="font-semibold text-gray-900">3</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-amber-500" />
              </div>
              <span className="text-gray-600 flex-1">Follow-ups due this week</span>
              <span className="font-semibold text-gray-900">18</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}