// src/components/Patients/modals/PatientViewModal.jsx
import { Pencil, Trash2 } from "lucide-react";
import ModalShell from "../../common/Modal/ModalShell";

function formatDob(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function Field({ label, value, className = "" }) {
  return (
    <div className={className}>
      <p className="text-sm font-medium text-gray-900 mb-1.5">{label}</p>
      <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 break-words">
        {value || "—"}
      </div>
    </div>
  );
}

// onEdit and onDelete are optional: the buttons show only when they are passed,
// so the Patients page keeps working as before.
export default function PatientViewModal({ patient, onClose, onEdit, onDelete }) {
  return (
    <ModalShell title="Patient Details" onClose={onClose} maxWidth="max-w-lg">
      <div className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-[1fr_2fr] gap-4">
          <Field label="Title" value={patient.title} />
          <Field label="Full Name" value={patient.name} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Date of Birth" value={formatDob(patient.date_of_birth)} />
          <Field label="Gender" value={patient.gender} />
          <Field label="Contact" value={patient.contact} />
        </div>

        <Field label="Reg. No" value={patient.regNo} className="w-3/5" />
        <Field label="Email ID" value={patient.email} />
        <Field label="Address" value={patient.address} />
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-300 text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 size={16} /> Delete
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer"
          >
            <Pencil size={16} /> Edit
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
}