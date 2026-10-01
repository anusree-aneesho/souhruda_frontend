// src/components/LabOrders/CancelledOrderModal.jsx
import { useState, useEffect } from "react";
import { getOrderApi } from "../../api/api";

export default function CancelledOrderModal({ order, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOrderApi(order.orderId)
      .then((res) => {
        if (!cancelled) setDetails(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load order.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [order.orderId]);

  const patientName = details
    ? [details.patient?.first_name, details.patient?.last_name].filter(Boolean).join(" ")
    : order.patient;

  const testNames = (details?.items || []).map((item) => item.lab_test?.name).filter(Boolean);
  const orderedAt = details?.ordered_at
  ? new Date(details.ordered_at).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  : order.date;

const bill = details?.bill_total ?? order.bill;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Cancelled Order <span className="text-gray-400 font-normal">#{order.orderId}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">Loading…</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 tracking-wide mb-1">PATIENT</p>
                  <p className="text-base font-bold text-gray-900">{patientName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 tracking-wide mb-1">REG. NO</p>
                  <p className="text-sm font-medium text-teal-600">
                    {details?.patient?.patient_number || order.regNo || "-"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-400 tracking-wide mb-2">TESTS</p>
                {testNames.length ? (
                  <ul className="space-y-1.5">
                    {testNames.map((name, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        {name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">{order.tests} test(s)</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs font-medium text-gray-400 tracking-wide mb-1">ORDERED</p>
                  <p className="text-sm text-gray-700">{orderedAt || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 tracking-wide mb-1">BILL</p>
                  <p className="text-sm font-semibold text-gray-900">₹{Number(bill ?? 0).toFixed(2)}</p>
                </div>
              </div>

              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
                Cancelled
              </span>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}