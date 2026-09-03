// src/components/FollowUps/FollowUpsTable/FollowUpRow.jsx
import StatusBadge from "../../Dashboard/TodaysOrders/StatusBadge";

export default function FollowUpRow({ patient, test, due, status }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 text-sm font-medium text-gray-900">{patient}</td>
      <td className="py-3 text-sm text-gray-700">{test}</td>
      <td className="py-3 text-sm text-gray-500">{due}</td>
      <td className="py-3">
        <StatusBadge status={status} />
      </td>
    </tr>
  );
}