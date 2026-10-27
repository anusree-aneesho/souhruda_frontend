// src/components/Reports/DailyRevenueReport.jsx
import { useState, useEffect, useCallback } from "react";
import { IndianRupee, CheckCircle2, Clock, ClipboardList, FlaskConical, Home } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import Pagination from "./shared/Pagination";
import { formatCurrency, todayIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getDailyRevenueReportApi } from "../../api/api";

const PAGE_SIZE = 10;

const TYPE_OPTIONS = [
  { value: "", label: "All orders" },
  { value: "lab", label: "Lab orders" },
  { value: "home_collection", label: "Home collection" },
];

const STATUS_LABEL = {
  pending: "Pending",
  sample_collected: "Sample Collected",
  completed: "Completed",
};

const FILTER_TITLES = {
  paid: "Paid orders on this day",
  pending: "Pending orders on this day",
};

function formatLongDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TypeCard({ title, icon: Icon, totals, loading }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-teal-600" />
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-gray-500">Orders</dt>
        <dd className="text-right text-gray-900">{loading ? "—" : totals?.orders ?? 0}</dd>
        <dt className="text-gray-500">Revenue</dt>
        <dd className="text-right text-gray-900">{loading ? "—" : formatCurrency(totals?.revenue)}</dd>
        <dt className="text-gray-500">Paid</dt>
        <dd className="text-right text-green-700">{loading ? "—" : formatCurrency(totals?.paid)}</dd>
        <dt className="text-gray-500">Pending</dt>
        <dd className="text-right text-amber-700">{loading ? "—" : formatCurrency(totals?.pending)}</dd>
      </dl>
    </div>
  );
}

// Makes a stat card clickable, with a ring when it is the active filter.
function ClickableCard({ active, onClick, children }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className={`cursor-pointer rounded-xl transition-shadow ${
        active ? "ring-2 ring-teal-500" : "hover:ring-1 hover:ring-teal-300"
      }`}
    >
      {children}
    </div>
  );
}

export default function DailyRevenueReport({ onBack }) {
  const [date, setDate] = useState(todayIso());
  const [type, setType] = useState("");
  const [filter, setFilter] = useState(""); // "" | "paid" | "pending"
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setPage(1); // back to the first page whenever the date or type changes
    try {
      const res = await getDailyRevenueReportApi({ date, type });
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [date, type]);

  useEffect(() => {
    load();
  }, [load]);

  function selectFilter(f) {
    setFilter((prev) => (prev === f ? "" : f)); // click again to clear
    setPage(1);
  }

  const summary = data?.summary;
  const byType = summary?.by_type;
  const allOrders = data?.orders || [];
  const isToday = date === todayIso();

  // An order is either paid (nothing left) or pending (balance left).
  const orders =
    filter === "paid"
      ? allOrders.filter((o) => o.pending <= 0)
      : filter === "pending"
      ? allOrders.filter((o) => o.pending > 0)
      : allOrders;

  // Hide the column that is always ₹0 in the selected view.
  const showPaidCol = filter !== "pending";
  const showPendingCol = filter !== "paid";
  const colCount = 6 + (showPaidCol ? 1 : 0) + (showPendingCol ? 1 : 0);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const pagedOrders = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Exports use ALL orders of the current view, not just the visible page.
  const headers = [
    "Order No",
    "Patient",
    "Type",
    "Time",
    "Status",
    "Revenue",
    ...(showPaidCol ? ["Paid"] : []),
    ...(showPendingCol ? ["Pending"] : []),
  ];
  const csvRows = orders.map((o) => [
    o.order_no,
    o.patient_name,
    o.type === "home_collection" ? "Home Collection" : "Lab",
    o.time,
    STATUS_LABEL[o.status] || o.status,
    o.revenue,
    ...(showPaidCol ? [o.paid] : []),
    ...(showPendingCol ? [o.pending] : []),
  ]);
  const fileName = `daily-revenue-${date}${filter ? `-${filter}` : ""}`;
  const pdfTitle = `Daily Revenue${filter ? ` (${filter})` : ""} — ${date}`;

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[{ label: "Date", value: date, onChange: (v) => v && setDate(v), max: todayIso() }]}
        onExportCsv={() => exportToCsv(fileName, headers, csvRows)}
        onExportPdf={() => exportToPdf(pdfTitle, headers, csvRows)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {isToday ? "Today" : formatLongDate(date)}
          </h2>
          {isToday && <p className="text-sm text-gray-500">{formatLongDate(date)}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isToday && (
            <button
              type="button"
              onClick={() => setDate(todayIso())}
              className="px-4 py-1.5 rounded-full text-sm border border-teal-600 text-teal-700 hover:bg-teal-50 cursor-pointer"
            >
              Back to today
            </button>
          )}
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
                type === opt.value
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && !data.payments_tracked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No payments have been recorded yet, so every order currently shows as pending.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClickableCard active={filter === ""} onClick={() => selectFilter("")}>
          <StatCard label="Revenue" value={loading ? "—" : formatCurrency(summary?.total_revenue)} icon={IndianRupee} color="teal" />
        </ClickableCard>
        <ClickableCard active={filter === "paid"} onClick={() => selectFilter("paid")}>
          <StatCard label="Paid" value={loading ? "—" : formatCurrency(summary?.paid)} icon={CheckCircle2} color="green" />
        </ClickableCard>
        <ClickableCard active={filter === "pending"} onClick={() => selectFilter("pending")}>
          <StatCard label="Pending" value={loading ? "—" : formatCurrency(summary?.pending)} icon={Clock} color="amber" />
        </ClickableCard>
        <StatCard label="Orders" value={loading ? "—" : summary?.orders ?? 0} icon={ClipboardList} color="blue" />
      </div>

      {/* Lab / Home Collection breakdown: only shown for "All orders" */}
      {type === "" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TypeCard title="Lab Orders" icon={FlaskConical} totals={byType?.lab} loading={loading} />
          <TypeCard title="Home Collection" icon={Home} totals={byType?.home_collection} loading={loading} />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {filter ? FILTER_TITLES[filter] : "Orders on this day"}
          </h3>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
                {showPaidCol && <th className="px-4 py-3 font-medium">Paid</th>}
                {showPendingCol && <th className="px-4 py-3 font-medium">Pending</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-8 text-center text-gray-400">
                    {filter ? `No ${filter} orders on this date.` : "No orders on this date."}
                  </td>
                </tr>
              ) : (
                pagedOrders.map((o) => (
                  <tr key={o.order_no} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-900">{o.order_no}</td>
                    <td className="px-4 py-3 text-gray-900">{o.patient_name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          o.type === "home_collection"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-teal-50 text-teal-700"
                        }`}
                      >
                        {o.type === "home_collection" ? o.hc_code || "Home Collection" : "Lab"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{o.time}</td>
                    <td className="px-4 py-3 text-gray-500">{STATUS_LABEL[o.status] || o.status}</td>
                    <td className="px-4 py-3 text-gray-900">{formatCurrency(o.revenue)}</td>
                    {showPaidCol && (
                      <td className="px-4 py-3 text-green-700">{formatCurrency(o.paid)}</td>
                    )}
                    {showPendingCol && (
                      <td className="px-4 py-3 text-amber-700">{formatCurrency(o.pending)}</td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}