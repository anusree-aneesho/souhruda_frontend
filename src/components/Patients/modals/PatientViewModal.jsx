import ModalShell from "../../common/Modal/ModalShell";

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-1.5">{label}</label>
      <div className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 bg-gray-50">
        {value || "—"}
      </div>
    </div>
  );
}

export default function PatientViewModal({ patient, onClose }) {
  if (!patient) return null;

  return (
    <ModalShell title="Patient Details" onClose={onClose} maxWidth="max-w-md">
      <div className="px-6 py-5 space-y-4">
        <ReadOnlyField label="Full Name" value={patient.name} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ReadOnlyField label="Date of Birth" value={patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : "—"} />
          <ReadOnlyField label="Gender" value={patient.gender} />
          <ReadOnlyField label="Contact" value={patient.contact} />
        </div>

        {patient.gender === "female" && (
          <ReadOnlyField
            label="Pregnant"
            value={patient.isPregnant ? "Yes" : "No"}
          />
        )}

        <ReadOnlyField label="Reg. No" value={patient.regNo} />
        <ReadOnlyField label="Email ID" value={patient.email} />
        <ReadOnlyField label="Address" value={patient.address} />
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
}