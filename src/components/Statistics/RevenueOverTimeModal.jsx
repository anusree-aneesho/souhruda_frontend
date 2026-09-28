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

export default function RevenueOverTimeModal({ initialRange = "Today", onClose }) {
  const navigate = useNavigate();
  const [range, setRange] = useState(initialRange);
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

  // Revenue excludes cancelled orders
  const orders = useMemo(() => {
    const [start, end] = getRangeBounds(range);
    return allOrders.filter((o) => {
      const d = new Date(o.ordered_at);
      return d >= start && d < end && o.status !== "cancelled";
    });
  }, [allOrders, range]);

  const sum = (list) => list.reduce((t, o) => t + Number(o.bill_total || 0), 0);
  const totalRevenue = sum(orders);
  const completedRevenue = sum(orders.filter((o) => o.status === "completed"));
  const pendingRevenue = totalRevenue - completedRevenue;
  const avgOrder = orders.length ? totalRevenue / orders.length : 0;

  const tiles = [
    { label: "Total Revenue", value: inr(totalRevenue), cls: "bg-gray-50 text-gray-900" },
    { label: "Completed", value: inr(completedRevenue), cls: "bg-green-50 text-green-700" },
    { label: "Pending", value: inr(pendingRevenue), cls: "bg-amber-50 text-amber-700" },
    { label: "Avg per Order", value: inr(avgOrder), cls: "bg-purple-50 text-purple-700" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Revenue Over Time (₹)</h2>
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
              <p className="text-xl font-bold">{t.value}</p>
            </div>
          ))}
        </div>

        {/* Orders table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="py-10 text-center text-xs text-gray-400">Loading…</p>
          ) : orders.length === 0 ? (
            <p className="py-10 text-center text-xs text-gray-400">No revenue in this range.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-6 py-2 font-medium">Order #</th>
                  <th className="py-2 font-medium">Patient</th>
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="px-6 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.order_no}
                    onClick={() => navigate(`/lab-orders/${o.order_no}`)}
                    className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-6 py-3 text-gray-500">#{o.order_no}</td>
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
            {orders.length} orders · Total: <span className="font-semibold text-gray-900">{inr(totalRevenue)}</span>
          </p>
          <button onClick={onClose} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}