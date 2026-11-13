import { useState, useEffect } from "react";
import { getStatisticsCollectionReportApi } from "../../api/api";

const statusStyles = {
  pending: "bg-amber-50 text-amber-700",
  sample_collected: "bg-indigo-50 text-indigo-700",
  completed: "bg-green-50 text-green-700",
  requested: "bg-gray-100 text-gray-600",
  assigned: "bg-blue-50 text-blue-700",
  en_route: "bg-sky-50 text-sky-700",
  collected: "bg-teal-50 text-teal-700",
  processing: "bg-indigo-50 text-indigo-700",
  report_ready: "bg-green-50 text-green-700",
  sent: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
};

const statusLabels = {
  pending: "Pending",
  sample_collected: "Sample Collected",
  completed: "Completed",
  requested: "Requested",
  assigned: "Assigned",
  en_route: "En Route",
  collected: "Collected",
  processing: "Sample Collected",
  report_ready: "Completed",
  sent: "Sent",
  cancelled: "Cancelled",
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatMoney = (n) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const sumBy = (list, key) =>
  list.reduce((total, r) => total + Number(r[key] ?? 0), 0);

export default function CollectionReportModal({ open, range, onRangeChange, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("all");
  const rangeOptions = ["Today", "Yesterday", "1 Week", "1 Month", "1 Year"];

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setTab("all");
    setLoading(true);
    (async () => {
      try {
        const res = await getStatisticsCollectionReportApi(range);
        if (!cancelled) setReport(res);
      } catch (err) {
        console.error("Failed to load collection report:", err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, range]);

  if (!open) return null;

  // Cancelled home collection orders are excluded everywhere.
  // Cancelled lab orders are still shown.
  const allRows = (report?.rows ?? []).filter(
    (r) => !(r.type === "home" && r.status === "cancelled")
  );

  const labRows = allRows.filter((r) => r.type === "lab");
  const homeRows = allRows.filter((r) => r.type === "home");

  const rows = tab === "lab" ? labRows : tab === "home" ? homeRows : allRows;

  // Counts and percentages (computed from the filtered rows)
  const totalCount = allRows.length;
  const labCount = labRows.length;
  const homeCount = homeRows.length;
  const labPercentage = totalCount ? Math.round((labCount / totalCount) * 100) : 0;
  const homePercentage = totalCount ? 100 - labPercentage : 0;

  // Footer totals for the active tab
  const totalBill = sumBy(rows, "bill_total");
  const totalPaid = sumBy(rows, "paid_amount");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Lab Orders vs Home Collection</h2>
            <p className="text-xs text-gray-400 mt-0.5">Range: {range}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Range filter */}
        {onRangeChange && (
          <div className="flex gap-2 flex-wrap px-6 pt-4">
            {rangeOptions.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRangeChange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                  r === range
                    ? "bg-teal-600 text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        {/* Summary tiles (click to filter the table) */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`rounded-xl bg-gray-50 px-4 py-3 text-left cursor-pointer transition hover:shadow-md ${
              tab === "all" ? "ring-2 ring-teal-600 ring-offset-1" : ""
            }`}
          >
            <p className="text-xs text-gray-500">Total Orders</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{loading ? "…" : totalCount}</p>
          </button>

          <button
            type="button"
            onClick={() => setTab("lab")}
            className={`rounded-xl bg-teal-50 px-4 py-3 text-left cursor-pointer transition hover:shadow-md ${
              tab === "lab" ? "ring-2 ring-teal-600 ring-offset-1" : ""
            }`}
          >
            <p className="text-xs text-teal-700">Lab Orders</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {loading ? "…" : labCount}
              <span className="text-xs font-normal text-gray-400 ml-1.5">({labPercentage}%)</span>
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTab("home")}
            className={`rounded-xl bg-purple-50 px-4 py-3 text-left cursor-pointer transition hover:shadow-md ${
              tab === "home" ? "ring-2 ring-purple-600 ring-offset-1" : ""
            }`}
          >
            <p className="text-xs text-purple-700">Home Collection</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {loading ? "…" : homeCount}
              <span className="text-xs font-normal text-gray-400 ml-1.5">({homePercentage}%)</span>
            </p>
          </button>
        </div>

        {/* Table */}
        {/* Fixed height: the box keeps its size while you switch range / tab, so it
            doesn't jump. The old rows stay (dimmed) until the new ones arrive. */}
        <div className="relative h-[340px] overflow-auto border-t border-gray-100">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="inline-block w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && rows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No orders in this range.</p>
          ) : (
            <table className={`w-full text-sm transition-opacity duration-150 ${loading ? "opacity-30 pointer-events-none" : ""}`}>
              <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="text-left font-medium px-6 py-2.5">Order ID</th>
                  <th className="text-left font-medium px-2 py-2.5">Patient</th>
                  <th className="text-left font-medium px-2 py-2.5">Type</th>
                  <th className="text-left font-medium px-2 py-2.5">Date</th>
                  <th className="text-left font-medium px-2 py-2.5">Status</th>
                  <th className="text-right font-medium px-2 py-2.5">Bill</th>
                  <th className="text-right font-medium px-6 py-2.5">Paid</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.order_id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-700">{r.order_no ?? r.order_id}</td>
                    <td className="px-2 py-3 text-gray-800">
                      {r.patient_name}
                      {r.patient_number && (
                        <span className="text-gray-400 text-xs"> · PID {r.patient_number}</span>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          r.type === "home" ? "bg-purple-50 text-purple-700" : "bg-teal-50 text-teal-700"
                        }`}
                      >
                        {r.type === "home" ? "Home Collection" : "Lab Order"}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-gray-500 whitespace-nowrap">{formatDate(r.ordered_at)}</td>
                    <td className="px-2 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          statusStyles[r.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {statusLabels[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right text-gray-500">{formatMoney(r.bill_total)}</td>
                    <td
                      className={`px-6 py-3 text-right font-medium ${
                        Number(r.paid_amount) > 0 ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {formatMoney(r.paid_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <span className="text-sm text-gray-600">
            Total bill: <span className="font-semibold text-gray-900">{loading ? "…" : formatMoney(totalBill)}</span>
            <span className="mx-2 text-gray-300">|</span>
            Total paid: <span className="font-semibold text-gray-900">{loading ? "…" : formatMoney(totalPaid)}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}