// src/components/LabOrders/LabOrdersTable/LabOrderRow.jsx
import StatusBadge from "../../Dashboard/TodaysOrders/StatusBadge";

// canOpen=false dims and disables the Open button (e.g. front office on non-completed orders).
export default function LabOrderRow({ orderId, patient, regNo, tests, status, date, bill, rawStatus, testNames, onOpen, canOpen = true }) {
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
          type="button"
          onClick={() =>
            canOpen &&
            onOpen({ orderId, patient, regNo, tests, status, date, bill, rawStatus, testNames })
          }
          disabled={!canOpen}
          title={canOpen ? undefined : "Only completed orders can be opened"}
          className={`text-sm font-medium ${
            canOpen
              ? "text-teal-600 hover:underline cursor-pointer"
              : "text-gray-300 cursor-not-allowed"
          }`}
        >
          Open →
        </button>
      </td>
    </tr>
  );
}