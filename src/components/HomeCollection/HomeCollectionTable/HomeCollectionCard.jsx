// src/components/HomeCollection/HomeCollectionTable/HomeCollectionCard.jsx
import StatusBadge from "../../Dashboard/TodaysOrders/StatusBadge";

export default function HomeCollectionCard({ requestId, patient, tests, distance, date, slot, payment, technician, status }) {
  return (
    <div className="border border-gray-100 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{patient}</p>
          <p className="text-xs text-teal-600">{requestId}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{tests} tests</span>
        <span>{distance}</span>
      </div>

      <p className="text-sm text-gray-700">
        {date} <span className="text-gray-400">· {slot}</span>
      </p>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-gray-500">{technician} · {payment}</span>
        <button className="text-sm text-teal-600 font-medium hover:underline">
          Open →
        </button>
      </div>
    </div>
  );
}