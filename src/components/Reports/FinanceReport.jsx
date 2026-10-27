// src/components/Reports/FinanceReport.jsx
import { useState, useEffect, useCallback } from "react";
import { IndianRupee, CheckCircle2, Clock, ClipboardList, FlaskConical, Home } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import Pagination from "./shared/Pagination";
import { formatCurrency, todayIso, daysAgoIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getFinanceReportApi } from "../../api/api";

const PAGE_SIZE = 10;

const TYPE_OPTIONS = [
  { value: "", label: "All orders" },
  { value: "lab", label: "Lab orders" },
  { value: "home_collection", label: "Home collection" },
];

const FILTER_TITLES = {
  paid: "Paid orders",
  pending: "Pending orders",
};

function TypeBreakdownCard({ title, icon: Icon, totals, loading }) {
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

export default function FinanceReport({ onBack }) {
  const [dateFrom, setDateFrom] = useState(daysAgoIso(30));
  const [dateTo, setDateTo] = useState(todayIso());
  const [type, setType] = useState("");
  const [filter, setFilter] = useState(""); // "" | "paid" | "pending"
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setPage(1); // back to the first page whenever the filters change
    try {
      const res = await getFinanceReportApi({ dateFrom, dateTo, type });
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, type]);

  useEffect(() => {
    load();
  }, [load]);

  function selectFilter(f) {
    setFilter((prev) => (prev === f ? "" : f)); // click again to clear
    setPage(1);
  }

  const rows = data?.rows || [];
  const allOrders = data?.orders || [];
  const byType = data?.summary?.by_type;

  // Uses the API's order count if present, otherwise sums the per-day rows.
  const totalOrders =
    data?.summary?.orders ?? rows.reduce((sum, r) => sum + (r.orders || 0), 0);

  // Orders view: an order is either paid (nothing left) or pending (balance left).
  const filteredOrders =
    filter === "paid"
      ? allOrders.filter((o) => o.pending <= 0)
      : filter === "pending"
      ? allOrders.filter((o) => o.pending > 0)
      : [];

  const showOrders = filter !== "";
  const list = showOrders ? filteredOrders : rows;

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const pagedList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Hide the column that is always ₹0 in the selected view.
  const showPaidCol = filter !== "pending"; // hidden in the Pending view
  const showPendingCol = filter !== "paid"; // hidden in the Paid view

  // Exports use ALL rows of the current view, not just the visible page.
  const dayHeaders = ["Date", "Orders", "Lab Revenue", "Home Collection Revenue", "Revenue", "Paid", "Pending"];
  const dayCsvRows = rows.map((r) => [
    r.date,
    r.orders,
    r.lab_revenue,
    r.home_collection_revenue,
    r.revenue,
    r.paid,
    r.pending,
  ]);

  const orderHeaders = [
    "Order No",
    "Patient",
    "Type",
    "Date",
    "Revenue",
    ...(showPaidCol ? ["Paid"] : []),
    ...(showPendingCol ? ["Pending"] : []),
  ];
  const orderCsvRows = filteredOrders.map((o) => [
    o.order_no,
    o.patient_name,
    o.type === "home_collection" ? "Home Collection" : "Lab",
    o.date,
    o.revenue,
    ...(showPaidCol ? [o.paid] : []),
    ...(showPendingCol ? [o.pending] : []),
  ]);

  const headers = showOrders ? orderHeaders : dayHeaders;
  const csvRows = showOrders ? orderCsvRows : dayCsvRows;
  const fileName = showOrders ? `finance-${filter}-orders` : "finance-report";
  const pdfTitle = showOrders ? `Finance Report — ${FILTER_TITLES[filter]}` : "Finance Report";
  const colCount = showOrders ? 5 + (showPaidCol ? 1 : 0) + (showPendingCol ? 1 : 0) : 7;

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
      fields={[
        {
          label: "Date From",
          value: dateFrom,
          onChange: (v) => v && setDateFrom(v),
          max: dateTo,
        },
        {
          label: "Date To",
          value: dateTo,
          onChange: (v) => v && v <= todayIso() && setDateTo(v),
          min: dateFrom,
          max: todayIso(),
        },
      ]}
        onExportCsv={() => exportToCsv(fileName, headers, csvRows)}
        onExportPdf={() => exportToPdf(pdfTitle, headers, csvRows)}
      />

      <div className="flex flex-wrap gap-2">
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && !data.payments_tracked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No payments have been recorded yet, so every order currently shows as pending. Paid
          amounts will populate once payments start being recorded against orders.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClickableCard active={filter === ""} onClick={() => selectFilter("")}>
          <StatCard label="Total Revenue" value={formatCurrency(data?.summary?.total_revenue)} icon={IndianRupee} color="teal" />
        </ClickableCard>
        <ClickableCard active={filter === "paid"} onClick={() => selectFilter("paid")}>
          <StatCard label="Paid" value={formatCurrency(data?.summary?.paid)} icon={CheckCircle2} color="green" />
        </ClickableCard>
        <ClickableCard active={filter === "pending"} onClick={() => selectFilter("pending")}>
          <StatCard label="Pending" value={formatCurrency(data?.summary?.pending)} icon={Clock} color="amber" />
        </ClickableCard>
        <StatCard label="Total Orders" value={loading ? "—" : totalOrders} icon={ClipboardList} color="blue" />
      </div>

      {/* Lab / Home Collection breakdown: only shown for "All orders" */}
      {type === "" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TypeBreakdownCard title="Lab Orders" icon={FlaskConical} totals={byType?.lab} loading={loading} />
          <TypeBreakdownCard title="Home Collection" icon={Home} totals={byType?.home_collection} loading={loading} />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {showOrders ? FILTER_TITLES[filter] : "Revenue by day"}
          </h3>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                {showOrders ? (
                  <>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Patient</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Revenue</th>
                    {showPaidCol && <th className="px-4 py-3 font-medium">Paid</th>}
                    {showPendingCol && <th className="px-4 py-3 font-medium">Pending</th>}
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Orders</th>
                    <th className="px-4 py-3 font-medium">Lab</th>
                    <th className="px-4 py-3 font-medium">Home Collection</th>
                    <th className="px-4 py-3 font-medium">Revenue</th>
                    <th className="px-4 py-3 font-medium">Paid</th>
                    <th className="px-4 py-3 font-medium">Pending</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-8 text-center text-gray-400">
                    {showOrders ? `No ${filter} orders in this range.` : "No orders in this range."}
                  </td>
                </tr>
              ) : showOrders ? (
                pagedList.map((o) => (
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
                    <td className="px-4 py-3 text-gray-500">{o.date}</td>
                    <td className="px-4 py-3 text-gray-900">{formatCurrency(o.revenue)}</td>
                    {showPaidCol && (
                      <td className="px-4 py-3 text-green-700">{formatCurrency(o.paid)}</td>
                    )}
                    {showPendingCol && (
                      <td className="px-4 py-3 text-amber-700">{formatCurrency(o.pending)}</td>
                    )}
                  </tr>
                ))
              ) : (
                pagedList.map((r) => (
                  <tr key={r.date} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-900">{r.date}</td>
                    <td className="px-4 py-3 text-gray-500">{r.orders}</td>
                    <td className="px-4 py-3 text-gray-500">{formatCurrency(r.lab_revenue)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatCurrency(r.home_collection_revenue)}</td>
                    <td className="px-4 py-3 text-gray-900">{formatCurrency(r.revenue)}</td>
                    <td className="px-4 py-3 text-green-700">{formatCurrency(r.paid)}</td>
                    <td className="px-4 py-3 text-amber-700">{formatCurrency(r.pending)}</td>
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