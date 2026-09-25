import { useState, useEffect } from "react";
import { getOrdersForRangeApi } from "../../api/api";
import {
  getStatisticsSummaryApi,
  getStatisticsRankingsApi,
  getStatisticsCollectionTypesApi,
  getStatisticsAttentionAlertsApi,
} from "../../api/api";
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

import OrdersTrendSection from "./OrdersTrendSection";

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
  const visibleOptions =
    showToday && active !== "Today"
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

function RankedList({ title, rows, unit = "", onViewAll }) {
  const max = Math.max(...rows.map((r) => r.count));
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs text-teal-600 font-medium hover:underline cursor-pointer"
        >
          View All
        </button>
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

// ─────────────────────────────────────────────────────────────
// RankingsModal — "View All" popup for Referral Sources / Tests / Categories
// ─────────────────────────────────────────────────────────────

function RankingsModal({ type, data, loading, onClose }) {
  if (!type) {
    return null;
  }

  let title = "";
  let rows = [];

  if (type === "doctors") {
    title = "All Referral Sources";
    rows = data?.topDoctors ?? [];
  } else if (type === "tests") {
    title = "All Ordered Tests";
    rows = data?.topTests ?? [];
  } else if (type === "categories") {
    title = "All Test Categories";
    rows = data?.topCategories ?? [];
  }

  const max = rows.length ? Math.max(...rows.map((r) => r.count)) : 0;

  const rankStyle = (index) => {
    if (index === 0) return "bg-amber-100 text-amber-700";
    if (index === 1) return "bg-gray-200 text-gray-600";
    if (index === 2) return "bg-orange-100 text-orange-700";
    return "bg-gray-50 text-gray-400";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {loading ? "Loading…" : `${rows.length} result${rows.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[420px] overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="py-10 text-center">
              <div className="inline-block w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400 mt-3">Loading rankings…</p>
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No data available.</p>
          ) : (
            <div className="space-y-1">
              {rows.map((row, index) => (
                <div
                  key={`${row.label}-${index}`}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 transition"
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${rankStyle(index)}`}
                  >
                    {index + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{row.label}</p>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="h-full bg-teal-500 rounded-full"
                        style={{ width: `${max ? (row.count / max) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <span className="text-sm font-semibold text-gray-900 w-10 text-right shrink-0">
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-400">
            {!loading && rows.length > 0 && `Top result: ${rows[0].label}`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AttentionModal — "View All" popup for Attention Needed
// Two tabs: Critical Results, Follow-ups Due
// ─────────────────────────────────────────────────────────────

function AttentionModal({ open, alerts, loading, onClose }) {
  const [tab, setTab] = useState("critical");

  if (!open) {
    return null;
  }

  const criticalResults = alerts?.criticalResults ?? [];
  const followUps = alerts?.followUps ?? [];

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Attention Needed</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3">
          <button
            type="button"
            onClick={() => setTab("critical")}
            className={`px-3 py-2 text-sm font-medium rounded-t-lg transition ${
              tab === "critical"
                ? "text-red-600 border-b-2 border-red-500"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Critical Results ({criticalResults.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("followups")}
            className={`px-3 py-2 text-sm font-medium rounded-t-lg transition ${
              tab === "followups"
                ? "text-amber-600 border-b-2 border-amber-500"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Follow-ups Due ({followUps.length})
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[420px] overflow-y-auto px-4 py-3 border-t border-gray-100">
          {loading ? (
            <div className="py-10 text-center">
              <div className="inline-block w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400 mt-3">Loading…</p>
            </div>
          ) : tab === "critical" ? (
            criticalResults.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No critical results flagged today.</p>
            ) : (
              <div className="space-y-1">
                {criticalResults.map((row, index) => (
                  <div
                    key={`${row.order_id}-${row.test_name}-${index}`}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <AlertTriangle size={15} className="text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">
                        {row.patient_name}
                        {row.patient_number && (
                          <span className="text-gray-400 font-normal"> · PID {row.patient_number}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {row.test_name} · Order #{row.order_id}
                      </p>
                    </div>  
                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-semibold ${
                          row.flag === "high" ? "text-red-600" : "text-blue-600"
                        }`}
                      >
                        {row.result} {row.result_unit || ""}
                      </p>
                      <p className="text-[11px] text-gray-400 uppercase">{row.flag}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : followUps.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No follow-ups due this week.</p>
          ) : (
            <div className="space-y-1">
              {followUps.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <Clock size={15} className="text-amber-500" />
                  </div>
                 <div className="flex-1 min-w-0">
  <p className="text-sm text-gray-800 truncate">
    {row.patient_name}
    {row.patient_number && (
      <span className="text-gray-400 font-normal"> · PID {row.patient_number}</span>
    )}
  </p>
  <p className="text-xs text-gray-400 truncate">
    {row.test_name} · Order #{row.order_id}
  </p>
</div>
                  <span className="text-xs text-gray-500 shrink-0">{formatDate(row.due_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Statistics() {
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  const [rankings, setRankings] = useState(null);
  const [rankingsLoading, setRankingsLoading] = useState(true);
  const [rankingsError, setRankingsError] = useState(null);

  const [collectionTypes, setCollectionTypes] = useState(null);
  const [collectionTypesLoading, setCollectionTypesLoading] = useState(true);

  const [alerts, setAlerts] = useState(null);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [attentionModalOpen, setAttentionModalOpen] = useState(false);

  const [viewAllType, setViewAllType] = useState(null);
  const [allRankings, setAllRankings] = useState(null);
  const [allRankingsLoading, setAllRankingsLoading] = useState(false);

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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await getStatisticsRankingsApi();

        if (!cancelled) {
          setRankings(res);
        }
      } catch (err) {
        if (!cancelled) {
          setRankingsError(err.message || "Couldn't load rankings.");
        }

        console.error("Failed to load statistics rankings:", err.message);
      } finally {
        if (!cancelled) {
          setRankingsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getStatisticsCollectionTypesApi();
        if (!cancelled) setCollectionTypes(res);
      } catch (err) {
        console.error("Failed to load collection types:", err.message);
      } finally {
        if (!cancelled) setCollectionTypesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getStatisticsAttentionAlertsApi();
        if (!cancelled) setAlerts(res);
      } catch (err) {
        console.error("Failed to load attention alerts:", err.message);
      } finally {
        if (!cancelled) setAlertsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleViewAll = async (type) => {
    setViewAllType(type);
    setAllRankingsLoading(true);

    try {
      const res = await getStatisticsRankingsApi(100);
      setAllRankings(res);
    } catch (err) {
      console.error("Failed to load all rankings:", err);
    } finally {
      setAllRankingsLoading(false);
    }
  };

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

  const topDoctors = rankings?.topDoctors ?? [];
  const topTests = rankings?.topTests ?? [];
  const topCategories = rankings?.topCategories ?? [];

  const statusSegments = [
    { label: "Completed", pct: 65.2, count: 478, colorHex: "#22C55E" },
    { label: "Pending", pct: 12.6, count: 92, colorHex: "#FBBF24" },
    { label: "Cancelled", pct: 22.2, count: 163, colorHex: "#F87171" },
  ];

  // Walk-in vs Home Collection — sourced from /statistics/collection-types
  const collectionSegments = [
    {
      label: "Lab Oders",
      count: collectionTypes?.walkIn ?? 0,
      pct: collectionTypes?.walkInPercentage ?? 0,
      colorHex: "#0D9488",
    },
    {
      label: "Home Collection",
      count: collectionTypes?.homeCollection ?? 0,
      pct: collectionTypes?.homeCollectionPercentage ?? 0,
      colorHex: "#A78BFA",
    },
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
      <OrdersTrendSection />

      {/* Row 4 — ranked lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RankedList
          title="Referral Sources"
          rows={topDoctors}
          onViewAll={() => handleViewAll("doctors")}
        />

        <RankedList
          title="Most Ordered Tests"
          rows={topTests}
          onViewAll={() => handleViewAll("tests")}
        />

        <RankedList
          title="Top Test Categories"
          rows={topCategories}
          onViewAll={() => handleViewAll("categories")}
        />
      </div>

      {/* Row 5 — collection type donut + attention-needed alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DonutCard
          title="Lab Orders vs Home Collection"
          total={collectionTypesLoading ? "…" : (collectionTypes?.total ?? 0)}
          segments={collectionSegments}
        />

        <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Attention Needed</h3>
            <button
              type="button"
              onClick={() => setAttentionModalOpen(true)}
              className="text-xs text-teal-600 font-medium hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} className="text-red-500" />
              </div>
              <span className="text-gray-600 flex-1">Critical results flagged today</span>
              <span className="font-semibold text-gray-900">
                {alertsLoading ? "…" : (alerts?.criticalResultsToday ?? 0)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-amber-500" />
              </div>
              <span className="text-gray-600 flex-1">Follow-ups due this week</span>
              <span className="font-semibold text-gray-900">
                {alertsLoading ? "…" : (alerts?.followUpsDueThisWeek ?? 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <RankingsModal
        type={viewAllType}
        data={allRankings}
        loading={allRankingsLoading}
        onClose={() => setViewAllType(null)}
      />

      <AttentionModal
        open={attentionModalOpen}
        alerts={alerts}
        loading={alertsLoading}
        onClose={() => setAttentionModalOpen(false)}
      />
    </div>
  );
}