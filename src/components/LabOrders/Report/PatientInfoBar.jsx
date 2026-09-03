// src/components/LabOrders/Report/PatientInfoBar.jsx
export default function PatientInfoBar({ patient, orderId, reportDate }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4 mb-4">
      <div>
        <p className="text-xs text-gray-400 tracking-wide">PATIENT</p>
        <p className="text-sm font-semibold text-gray-900">{patient.name}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 tracking-wide">REG. NO.</p>
        <p className="text-sm font-semibold text-gray-900">{patient.regNo}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 tracking-wide">ORDER NO.</p>
        <p className="text-sm font-semibold text-gray-900">{orderId}</p>
      </div>

      <div>
        <p className="text-xs text-gray-400 tracking-wide">AGE / GENDER</p>
        <p className="text-sm font-semibold text-gray-900">{patient.age} Yrs / {patient.gender}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 tracking-wide">REFERRED BY</p>
        <p className="text-sm font-semibold text-gray-900">Self</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 tracking-wide">REPORT DATE</p>
        <p className="text-sm font-semibold text-gray-900">{reportDate}</p>
      </div>
    </div>
  );
}