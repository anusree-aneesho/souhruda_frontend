// src/components/Patients/PatientsTable/PatientRow.jsx
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useOrderModal } from "../../../Context/OrderModalContext";
import { useAuth } from "../../../Context/AuthContext";

function IconButton({ label, onClick, className, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`p-1.5 rounded-md transition-colors cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
}

export default function PatientRow({ id, regNo, name, age, gender, contact, orders, onView, onEdit, onDelete }) {
  const { open } = useOrderModal();
  const { user } = useAuth();
  const canBookTests = user?.role !== "front_office";

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 text-sm text-gray-500">{regNo}</td>
      <td className="py-3 text-sm font-medium text-gray-900">{name}</td>
      <td className="py-3 text-sm text-gray-500">{age} Yrs, {gender}</td>
      <td className="py-3 text-sm text-gray-500">{contact}</td>
      <td className="py-3 text-sm text-teal-600 font-medium">{orders}</td>
      <td className="py-3 whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          <IconButton label="View patient" onClick={() => onView(id)} className="text-teal-600 hover:bg-teal-50">
            <Eye size={17} />
          </IconButton>
          <IconButton label="Edit patient" onClick={() => onEdit(id)} className="text-teal-600 hover:bg-teal-50">
            <Pencil size={17} />
          </IconButton>
          <IconButton label="Remove patient" onClick={() => onDelete(id)} className="text-red-500 hover:bg-red-50">
            <Trash2 size={17} />
          </IconButton>
          {canBookTests && (
            <>
              <span className="mx-2 h-4 w-px bg-gray-200" />
              <button
                onClick={() => open("order", regNo)}
                className="text-sm text-teal-600 font-medium hover:underline cursor-pointer"
              >
                Book test →
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}