// src/components/FollowUps/FollowUpsTable/FollowUpCard.jsx
import StatusBadge from "../../Dashboard/TodaysOrders/StatusBadge";

export default function FollowUpCard({ patient, test, due, status }) {
  return (
    <div className="border border-gray-100 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">{patient}</p>
        <StatusBadge status={status} />
      </div>
      <p className="text-sm text-gray-700">{test}</p>
      <p className="text-xs text-gray-400">Due {due}</p>
    </div>
  );
}