// src/components/LabAssistants/LabAssistantsTable/LabAssistantRow.jsx
import LabAssistantStatusBadge from "./LabAssistantStatusBadge";

export default function LabAssistantRow({ labAssistant, onEdit, onRemove }) {
  const { laId, name, email, phone, branch, status } = labAssistant;
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 text-sm text-gray-500">{laId}</td>
      <td className="py-3 text-sm font-medium text-gray-900">{name}</td>
      <td className="py-3 text-sm text-gray-500">{email}</td>
      <td className="py-3 text-sm text-gray-500">{phone}</td>
      <td className="py-3 text-sm text-gray-500">{branch}</td>
      <td className="py-3 text-sm">
        <LabAssistantStatusBadge status={status} />
      </td>
      <td className="py-3 text-right space-x-3 whitespace-nowrap">
        <button onClick={() => onEdit(labAssistant)} className="text-sm text-teal-600 font-medium hover:underline cursor-pointer">
          Edit
        </button>
        <button onClick={() => onRemove(labAssistant)} className="text-sm text-red-500 font-medium hover:underline cursor-pointer">
          Remove
        </button>
      </td>
    </tr>
  );
}
