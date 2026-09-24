// src/components/LabOrders/OrderDetail/ResultRow.jsx
import StatusBadge from "../../Dashboard/TodaysOrders/StatusBadge";

export default function ResultRow({ test, result, flag, onResultChange }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3">
        <p className="text-sm font-medium text-gray-900">{test.name}</p>
        <p className="text-xs text-gray-400">{test.category}</p>
      </td>
      <td className="py-3 text-sm text-gray-500">{test.unit || "-"}</td>
      <td className="py-3 text-sm text-teal-600">{test.range}</td>
      <td className="py-3">
        <input
          value={result}
          onChange={(e) => onResultChange(test.id, e.target.value)}
          placeholder="Enter result"
          className="w-32 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
        />
      </td>
      <td className="py-3"><StatusBadge status={flag} /></td>
      <td className="py-3 text-sm">
        {test.packageId != null ? (
          <span className="text-teal-600 text-xs font-medium">In package</span>
        ) : (
          <span className="text-gray-900">₹{test.price.toFixed(2)}</span>
        )}
      </td>
    </tr>
  );
}