import ModalShell from "../../common/Modal/ModalShell";

export default function PatientViewModal({ patient, onClose }) {
  if (!patient) return null;

  return (
    <ModalShell title="Patient Details" onClose={onClose} maxWidth="max-w-md">
      <div className="px-6 py-5 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Reg. No</p>
          <p className="text-sm text-gray-900 mt-1">{patient.regNo}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Name</p>
          <p className="text-sm text-gray-900 mt-1">{patient.name}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Age</p>
            <p className="text-sm text-gray-900 mt-1">{patient.age} Yrs</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Gender</p>
            <p className="text-sm text-gray-900 mt-1">{patient.gender}</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</p>
          <p className="text-sm text-gray-900 mt-1">{patient.contact}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</p>
          <p className="text-sm text-gray-900 mt-1">{patient.email || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Address</p>
          <p className="text-sm text-gray-900 mt-1">{patient.address || "—"}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
}