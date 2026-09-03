// src/components/Technicians/TechniciansTable/TechnicianRow.jsx
import { Star } from "lucide-react";
import CurrentStatusBadge from "./CurrentStatusBadge";
import AccountStatusBadge from "./AccountStatusBadge";

export default function TechnicianRow({ technician, onEdit, onRemove }) {
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
      <td className="py-3 text-right space-x-3 whitespace-nowrap">
        <button onClick={() => onEdit(technician)} className="text-sm text-teal-600 font-medium hover:underline cursor-pointer">
          Edit
        </button>
        <button onClick={() => onRemove(technician)} className="text-sm text-red-500 font-medium hover:underline cursor-pointer">
          Remove
        </button>
      </td>
    </tr>
  );
}
