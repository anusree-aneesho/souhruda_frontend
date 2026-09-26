// src/components/LabOrders/LabOrdersTable/LabOrderRow.jsx
import StatusBadge from "../../Dashboard/TodaysOrders/StatusBadge";

export default function LabOrderRow({ orderId, patient, regNo, tests, status, date, bill, rawStatus, testNames, onOpen }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 text-sm text-gray-500">{orderId}</td>
      <td className="py-3 text-sm font-medium text-gray-900">{patient}</td>
      <td className="py-3 text-sm text-teal-600">{regNo}</td>
      <td className="py-3 text-sm text-gray-500">{tests} tests</td>
      <td className="py-3"><StatusBadge status={status} /></td>
      <td className="py-3 text-sm text-gray-500">{date}</td>
      <td className="py-3 text-sm text-gray-900">₹{bill}</td>
      <td className="py-3 text-right">
        <button
          onClick={() => onOpen({ orderId, patient, regNo, tests, status, date, bill, rawStatus, testNames })}
          className="text-sm text-teal-600 font-medium hover:underline"
        >
          Open →
        </button>
      </td>
    </tr>
  );
}