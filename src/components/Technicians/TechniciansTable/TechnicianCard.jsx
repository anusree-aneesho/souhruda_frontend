// src/components/Technicians/TechniciansTable/TechnicianCard.jsx
import { Star } from "lucide-react";
import CurrentStatusBadge from "./CurrentStatusBadge";
import AccountStatusBadge from "./AccountStatusBadge";

export default function TechnicianCard({ technician, onEdit, onRemove }) {
  const { techId, name, phone, zone, rating, status, assignedJobs, currentStatus } = technician;
  return (
    <div className="border border-gray-100 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <AccountStatusBadge status={status} />
      </div>
      <p className="text-xs text-gray-400">{techId}</p>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{zone}</span>
        <span>{phone}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-1 text-gray-700">
          <Star size={14} className="text-amber-400 fill-amber-400" />
          {rating}
        </span>
        <span className="text-teal-600 font-medium">{assignedJobs} jobs</span>
        <CurrentStatusBadge status={currentStatus} />
      </div>
      <div className="flex items-center gap-4 pt-1">
        <button onClick={() => onEdit(technician)} className="text-sm text-teal-600 font-medium hover:underline cursor-pointer">
          Edit
        </button>
        <button onClick={() => onRemove(technician)} className="text-sm text-red-500 font-medium hover:underline cursor-pointer">
          Remove
        </button>
      </div>
    </div>
  );
}
