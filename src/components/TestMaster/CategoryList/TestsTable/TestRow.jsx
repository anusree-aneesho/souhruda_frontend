// src/components/TestMaster/TestsTable/TestRow.jsx
export default function TestRow({ test, onEdit, onRemove, onViewRange }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 text-sm font-medium text-gray-900">{test.name}</td>
      <td className="py-3 text-sm text-gray-500">{test.unit}</td>
      <td className="py-3 text-sm">
        <button
          onClick={() => onViewRange(test)}
          className="text-xs text-teal-600 font-medium hover:underline cursor-pointer"
        >
          View
        </button>
      </td>
      <td className="py-3 text-sm text-gray-900">₹{Number(test.price).toFixed(2)}</td>
      <td className="py-3 text-right space-x-3">
        <button onClick={() => onEdit(test)} className="text-sm text-teal-600 font-medium hover:underline cursor-pointer">
          Edit
        </button>
        <button onClick={() => onRemove(test)} className="text-sm text-red-500 font-medium hover:underline cursor-pointer">
          Remove
        </button>
      </td>
    </tr>
  );
}
