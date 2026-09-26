// src/components/LabOrders/SampleCollectionModal.jsx
import { useState } from "react";
import { markSampleCollectedApi } from "../../api/api";

export default function SampleCollectionModal({ order, onClose, onConfirmed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await markSampleCollectedApi(order.orderId);
      onConfirmed(order.orderId);
    } catch (err) {
      setError(err.message || "Failed to update status.");
    } finally {
      setLoading(false);
    }
  }

  const testList = order.testNames?.length ? order.testNames : null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Sample Collection — #{order.orderId}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-400 tracking-wide mb-1">PATIENT</p>
              <p className="text-sm font-medium text-gray-900">{order.patient || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 tracking-wide mb-1">REG. NO</p>
              <p className="text-sm font-medium text-teal-600">{order.regNo || "-"}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-400 tracking-wide mb-2">TESTS</p>
            {testList ? (
              <ul className="space-y-1.5">
                {testList.map((name, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                    {name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">{order.tests} test(s)</p>
            )}
          </div>

          <p className="text-sm text-gray-500 pt-1">
            Confirm that the sample for this order has been physically collected.
          </p>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2 text-sm rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? "Marking…" : "Mark Sample Collected"}
          </button>
        </div>
      </div>
    </div>
  );
}