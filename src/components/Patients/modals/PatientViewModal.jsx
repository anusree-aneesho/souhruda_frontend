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
      <div className="px-6 py-5 space-y-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500">
        <ReadOnlyField className="" label="Full Name" value={patient.name} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ReadOnlyField label="Age" value={`${patient.age} Yrs`} />
          <ReadOnlyField label="Gender" value={patient.gender} />
          <ReadOnlyField label="Contact" value={patient.contact} />
        </div>

        <ReadOnlyField label="Reg. No" value={patient.regNo} />
        <ReadOnlyField label="Email ID" value={patient.email} />
        <ReadOnlyField label="Address" value={patient.address} />
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer"
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
}