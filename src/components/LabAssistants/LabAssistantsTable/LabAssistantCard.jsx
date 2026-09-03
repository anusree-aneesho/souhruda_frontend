// src/components/LabAssistants/LabAssistantsTable/LabAssistantCard.jsx
import LabAssistantStatusBadge from "./LabAssistantStatusBadge";

export default function LabAssistantCard({ labAssistant, onEdit, onRemove }) {
  const { laId, name, email, phone, branch, status } = labAssistant;
  return (
    <div className="border border-gray-100 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <LabAssistantStatusBadge status={status} />
      </div>
      <p className="text-xs text-gray-400">{laId}</p>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{branch}</span>
        <span>{phone}</span>
      </div>
      <p className="text-sm text-gray-500">{email}</p>
      <div className="flex items-center gap-4 pt-1">
        <button onClick={() => onEdit(labAssistant)} className="text-sm text-teal-600 font-medium hover:underline cursor-pointer">
          Edit
        </button>
        <button onClick={() => onRemove(labAssistant)} className="text-sm text-red-500 font-medium hover:underline cursor-pointer">
          Remove
        </button>
      </div>
    </div>
  );
}
