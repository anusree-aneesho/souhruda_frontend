// src/components/LabOrders/LabOrdersTable/LabOrderCard.jsx
import StatusBadge from "../../Dashboard/TodaysOrders/StatusBadge";

export default function LabOrderCard({ orderId, patient, regNo, tests, status, date, bill }) {
  return (
    <div className="border border-gray-100 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">{patient}</p>
        <StatusBadge status={status} />
      </div>
      <p className="text-xs text-gray-400">
        #{orderId} · {regNo}
      </p>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{tests} tests</span>
        <span>{date}</span>
      </div>
      <div className="flex items-center justify-between pt-1">
        <span className="text-sm font-medium text-gray-900">₹{bill}</span>
        <button className="text-sm text-teal-600 font-medium hover:underline">
          Open →
        </button>
      </div>
    </div>
  );
}