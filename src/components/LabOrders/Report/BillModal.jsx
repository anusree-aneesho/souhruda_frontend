// src/components/LabOrders/Report/BillModal.jsx
import { CheckCircle2 } from "lucide-react";
import ModalShell from "../../common/Modal/ModalShell";

export default function BillModal({ orderId, patient, tests, paymentDone, onClose }) {
  const total = tests.reduce((sum, t) => sum + t.price, 0);

  return (
    <ModalShell title={`Bill — Order #${orderId}`} onClose={onClose} maxWidth="max-w-md">
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">Billed to <span className="font-semibold text-gray-900">{patient.name}</span></p>
          {paymentDone && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
              <CheckCircle2 size={13} />
              Paid
            </span>
          )}
        </div>

        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-1">
          <span className="text-xs font-medium text-gray-400 tracking-wide">ITEM</span>
          <span className="text-xs font-medium text-gray-400 tracking-wide">AMOUNT</span>
        </div>
        {tests.map((test) => (
          <div key={test.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-900">{test.name}</span>
            <span className="text-sm text-gray-700">₹{test.price.toFixed(2)}</span>
          </div>
        ))}

        <div
          className={`flex items-center justify-between rounded-lg px-4 py-3 mt-3 ${
            paymentDone ? "bg-green-50" : "bg-teal-50"
          }`}
        >
          <span className={`text-sm font-medium ${paymentDone ? "text-green-700" : "text-teal-700"}`}>
            {paymentDone ? "Paid" : "Total payable"}
          </span>
          <span className={`text-lg font-bold ${paymentDone ? "text-green-700" : "text-teal-700"}`}>
            ₹{total.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Close
        </button>
        <button onClick={() => window.print()} className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700">
          Print Bill
        </button>
      </div>
    </ModalShell>
  );
}