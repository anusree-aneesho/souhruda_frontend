// src/components/Staff/StaffTable/StaffRow.jsx
import StaffStatusBadge from "./StaffStatusBadge";

export default function StaffRow({ staff, onEdit, onRemove }) {
  const { staffId, name, email, phone, branch, status } = staff;
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 text-sm text-gray-500">{staffId}</td>
      <td className="py-3 text-sm font-medium text-gray-900">{name}</td>
      <td className="py-3 text-sm text-gray-500">{email}</td>
      <td className="py-3 text-sm text-gray-500">{phone}</td>
      <td className="py-3 text-sm text-gray-500">{branch}</td>
      <td className="py-3 text-sm">
        <StaffStatusBadge status={status} />
      </td>
      <td className="py-3 text-right space-x-3 whitespace-nowrap">
        <button onClick={() => onEdit(staff)} className="text-sm text-teal-600 font-medium hover:underline cursor-pointer">
          Edit
        </button>
        <button onClick={() => onRemove(staff)} className="text-sm text-red-500 font-medium hover:underline cursor-pointer">
          Remove
        </button>
      </td>
    </tr>
  );
}
