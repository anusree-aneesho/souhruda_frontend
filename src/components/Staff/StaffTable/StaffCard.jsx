// src/components/Staff/StaffTable/StaffCard.jsx
import StaffStatusBadge from "./StaffStatusBadge";

export default function StaffCard({ staff, onEdit, onRemove }) {
  const { staffId, name, email, phone, branch, status } = staff;
  return (
    <div className="border border-gray-100 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <StaffStatusBadge status={status} />
      </div>
      <p className="text-xs text-gray-400">{staffId}</p>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{branch}</span>
        <span>{phone}</span>
      </div>
      <p className="text-sm text-gray-500">{email}</p>
      <div className="flex items-center gap-4 pt-1">
        <button onClick={() => onEdit(staff)} className="text-sm text-teal-600 font-medium hover:underline cursor-pointer">
          Edit
        </button>
        <button onClick={() => onRemove(staff)} className="text-sm text-red-500 font-medium hover:underline cursor-pointer">
          Remove
        </button>
      </div>
    </div>
  );
}
