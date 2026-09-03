// src/components/Dashboard/TodaysOrders/OrdersTableRow.jsx
import { Link } from "react-router-dom";
import StatusBadge from "../../Dashboard/TodaysOrders/StatusBadge";

export default function OrdersTableRow({ order, patient, tests, status, time }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 text-sm text-gray-500">#{order}</td>
      <td className="py-3 text-sm font-medium text-gray-900">{patient}</td>
      <td className="py-3 text-sm text-gray-500">{tests} tests</td>
      <td className="py-3">
        <StatusBadge status={status} />
      </td>
      <td className="py-3 text-sm text-gray-500">{time}</td>
      <td className="py-3 text-right">
        <Link to={`/lab-orders/${order}`} className="text-sm text-teal-600 font-medium hover:underline">
          View →
        </Link>
      </td>
    </tr>
  );
}