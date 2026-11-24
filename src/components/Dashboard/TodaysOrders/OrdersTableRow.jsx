// src/components/Dashboard/TodaysOrders/OrdersTableRow.jsx
import StatusBadge from "./StatusBadge";

// canOpen=false dims and disables the View button (e.g. front office on non-completed orders).
export default function OrdersTableRow({ order, patient, regNo, tests, testNames, status, rawStatus, time, onOpen, canOpen = true }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 text-sm text-gray-500">{order}</td>
      <td className="py-3 text-sm font-medium text-gray-900">{patient}</td>
      <td className="py-3 text-sm text-gray-500">
        {tests} test{tests === 1 ? "" : "s"}
      </td>
      <td className="py-3">
        <StatusBadge status={status} />
      </td>
      <td className="py-3 text-sm text-gray-500">{time}</td>
      <td className="py-3 text-right">
        <button
          type="button"
          onClick={() =>
            canOpen &&
            onOpen({ order, patient, regNo, tests, testNames, status, rawStatus, time })
          }
          disabled={!canOpen}
          title={canOpen ? undefined : "Only completed orders can be opened"}
          className={`text-sm font-medium ${
            canOpen
              ? "text-teal-600 hover:underline cursor-pointer"
              : "text-gray-300 cursor-not-allowed"
          }`}
        >
          View →
        </button>
      </td>
    </tr>
  );
}