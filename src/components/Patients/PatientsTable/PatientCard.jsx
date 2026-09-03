import { useOrderModal } from "../../../Context/OrderModalContext";

// src/components/Patients/PatientsTable/PatientCard.jsx
export default function PatientCard({ regNo, name, age, gender, contact, orders }) {
   const { open } = useOrderModal();
  return (
    <div className="border border-gray-100 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <span className="text-xs text-teal-600 font-medium">{orders} orders</span>
      </div>
      <p className="text-xs text-gray-400">{regNo}</p>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{age} Yrs, {gender}</span>
        <span>{contact}</span>
      </div>
      <div className="flex items-center gap-4 pt-1">
        <button onClick={()=> open("order", regNo)} className="text-sm text-teal-600 font-medium hover:underline cursor-pointer">
          Book test →
        </button>
        <button onClick={() => open("homeCollection", regNo)} className="text-sm text-teal-600 font-medium hover:underline cursor-pointer">
          Home collection →
        </button>
      </div>
    </div>
  );
}