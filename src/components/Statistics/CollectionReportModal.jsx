import { useState, useEffect } from "react";
import { getStatisticsCollectionReportApi } from "../../api/api";

const statusStyles = {
  pending: "bg-amber-50 text-amber-700",
  sample_collected: "bg-indigo-50 text-indigo-700",
  completed: "bg-green-50 text-green-700",
};

const statusLabels = {
  pending: "Pending",
  sample_collected: "Sample Collected",
  completed: "Completed",
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

export default function CollectionReportModal({ open, range, onRangeChange, onClose })  {
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

  const allRows = report?.rows ?? [];
  const rows = tab === "all" ? allRows : allRows.filter((r) => r.type === tab);
  const totalBill = report?.totalBill ?? allRows.reduce((s, r) => s + Number(r.bill_total || 0), 0);

  const tabs = [
    { key: "all", label: `All (${report?.total ?? 0})`, active: "text-teal-600 border-teal-500" },
    { key: "lab", label: `Lab Orders (${report?.lab ?? 0})`, active: "text-teal-600 border-teal-500" },
    { key: "home", label: `Home Collection (${report?.home ?? 0})`, active: "text-purple-600 border-purple-500" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
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

        {/* Summary tiles */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4">
          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-500">Total Orders</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{loading ? "…" : report?.total ?? 0}</p>
          </div>
          <div className="rounded-xl bg-teal-50 px-4 py-3">
            <p className="text-xs text-teal-700">Lab Orders</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {loading ? "…" : report?.lab ?? 0}
              <span className="text-xs font-normal text-gray-400 ml-1.5">({report?.labPercentage ?? 0}%)</span>
            </p>
          </div>
          <div className="rounded-xl bg-purple-50 px-4 py-3">
            <p className="text-xs text-purple-700">Home Collection</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {loading ? "…" : report?.home ?? 0}
              <span className="text-xs font-normal text-gray-400 ml-1.5">({report?.homePercentage ?? 0}%)</span>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 border-b border-gray-100">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition ${
                tab === t.key ? t.active : "text-gray-400 border-transparent hover:text-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="max-h-[360px] overflow-auto">
          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400 mt-3">Loading…</p>
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No orders in this range.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="text-left font-medium px-6 py-2.5">Order</th>
                  <th className="text-left font-medium px-2 py-2.5">Patient</th>
                  <th className="text-left font-medium px-2 py-2.5">Type</th>
                  <th className="text-left font-medium px-2 py-2.5">Date</th>
                  <th className="text-left font-medium px-2 py-2.5">Status</th>
                  <th className="text-right font-medium px-6 py-2.5">Bill</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.order_id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-700">{r.order_id}</td>
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
                    <td className="px-6 py-3 text-right font-medium text-gray-900">{formatMoney(r.bill_total)}</td>
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