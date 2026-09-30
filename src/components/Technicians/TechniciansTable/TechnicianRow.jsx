// src/components/Technicians/TechniciansTable/TechnicianRow.jsx
import { Star, Pencil, Trash2 } from "lucide-react";
import CurrentStatusBadge from "./CurrentStatusBadge";
import AccountStatusBadge from "./AccountStatusBadge";

export default function TechnicianRow({ technician, onEdit, onRemove, canManage = false }) {
  const { techId, name, phone, zone, rating, status, assignedJobs, currentStatus } = technician;
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 text-sm text-gray-500">{techId}</td>
      <td className="py-3 text-sm font-medium text-gray-900">{name}</td>
      <td className="py-3 text-sm text-gray-500">{phone}</td>
      <td className="py-3 text-sm text-gray-500">{zone}</td>
      <td className="py-3 text-sm text-gray-700">
        <span className="inline-flex items-center gap-1">
          <Star size={14} className="text-amber-400 fill-amber-400" />
          {rating}
        </span>
      </td>
      <td className="py-3 text-sm text-teal-600 font-medium">{assignedJobs}</td>
      <td className="py-3 text-sm">
        <CurrentStatusBadge status={currentStatus} />
      </td>
      <td className="py-3 text-sm">
        <AccountStatusBadge status={status} />
      </td>
      {canManage && (
        <td className="py-3">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => onEdit(technician)}
              aria-label={`Edit ${name}`}
              title="Edit"
              className="p-1.5 rounded-md text-teal-600 hover:bg-teal-50 cursor-pointer"
            >
              <Pencil size={16} />
            </button>
            {/* <button
              onClick={() => onRemove(technician)}
              aria-label={`Remove ${name}`}
              title="Remove"
              className="p-1.5 rounded-md text-red-500 hover:bg-red-50 cursor-pointer"
            >
              <Trash2 size={16} />
            </button> */}
          </div>
        </td>
      )}
    </tr>
  );
}