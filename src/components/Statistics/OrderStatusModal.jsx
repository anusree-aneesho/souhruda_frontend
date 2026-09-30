import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { getOrdersApi } from "../../api/api";
import { RANGES, getRangeBounds } from "../../utils/dateRange";

const STATUS_STYLES = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  sample_collected: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

function statusLabel(s) {
  return (s || "").split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const inr = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function OrderStatusModal({ initialRange = "Today", onClose }) {
  const navigate = useNavigate();
  const [range, setRange] = useState(initialRange);
  const [tab, setTab] = useState("all");
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getOrdersApi({ per_page: 500 })
      .then((res) => {
        if (!cancelled) setAllOrders(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setAllOrders([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // Orders in the selected range
  const inRange = useMemo(() => {
    const [start, end] = getRangeBounds(range);
    return allOrders.filter((o) => {
      const d = new Date(o.ordered_at);
      return d >= start && d < end;
    });
  }, [allOrders, range]);

  const count = (status) => inRange.filter((o) => o.status === status).length;
  const total = inRange.length;
  const pct = (n) => (total ? `${((n / total) * 100).toFixed(1)}%` : "0%");

  const tiles = [
    { label: "Total Orders", value: total, sub: null, cls: "bg-gray-50 text-gray-900" },
    { label: "Completed", value: count("completed"), sub: pct(count("completed")), cls: "bg-green-50 text-green-700" },
    { label: "Pending", value: count("pending"), sub: pct(count("pending")), cls: "bg-amber-50 text-amber-700" },
    { label: "Cancelled", value: count("cancelled"), sub: pct(count("cancelled")), cls: "bg-red-50 text-red-700" },
  ];

  const tabs = [
    { key: "all", label: "All", n: total },
    { key: "completed", label: "Completed", n: count("completed") },
    { key: "pending", label: "Pending", n: count("pending") },
    { key: "cancelled", label: "Cancelled", n: count("cancelled") },
  ];

  const visible = tab === "all" ? inRange : inRange.filter((o) => o.status === tab);
  const totalBill = visible.reduce((sum, o) => sum + Number(o.bill_total || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Order Status Distribution</h2>
          <button onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Range filter */}
        <div className="flex flex-wrap gap-2 px-6 pt-4">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                r === range
                  ? "bg-teal-600 text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 gap-3 px-6 py-4 sm:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className={`rounded-lg p-3 ${t.cls}`}>
              <p className="text-xs opacity-80">{t.label}</p>
              <p className="text-xl font-bold">
                {t.value}
                {t.sub && <span className="ml-1.5 text-xs font-normal opacity-70">({t.sub})</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Status tabs */}
        <div className="flex gap-5 border-b border-gray-100 px-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 pb-2 text-sm font-medium ${
                tab === t.key
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label} ({t.n})
            </button>
          ))}
        </div>

        {/* Orders table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="py-10 text-center text-xs text-gray-400">Loading…</p>
          ) : visible.length === 0 ? (
            <p className="py-10 text-center text-xs text-gray-400">No orders in this range.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-6 py-2 font-medium">Order</th>
                  <th className="py-2 font-medium">Patient</th>
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="px-6 py-2 text-right font-medium">Bill</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => (
                  <tr
                    key={o.order_no}
                    onClick={() => navigate(`/lab-orders/${o.order_no}`)}
                    className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-6 py-3 text-gray-500">{o.order_no}</td>
                    <td className="py-3 font-medium text-gray-900">
                      {[o.patient?.first_name, o.patient?.last_name].filter(Boolean).join(" ")}
                      {o.patient?.patient_number && (
                        <span className="ml-1 font-normal text-gray-400">
                          · {o.patient.patient_number}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-gray-500">
                      {new Date(o.ordered_at).toLocaleString("en-GB", {
                        day: "2-digit", month: "short", hour: "numeric", minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[o.status] || "bg-gray-100 text-gray-500"}`}>
                        {statusLabel(o.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-gray-900">
                      {inr(Number(o.bill_total || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4 rounded-b-2xl">
          <p className="text-sm text-gray-500">
            Total bill: <span className="font-semibold text-gray-900">{inr(totalBill)}</span>
          </p>
          <button onClick={onClose} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}