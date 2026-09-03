import { useOrderModal } from "../../../Context/OrderModalContext";

// src/components/Patients/PatientsTable/PatientRow.jsx
export default function PatientRow({ regNo, name, age, gender, contact, orders }) {
  const { open } = useOrderModal();
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 text-sm text-gray-500">{regNo}</td>
      <td className="py-3 text-sm font-medium text-gray-900">{name}</td>
      <td className="py-3 text-sm text-gray-500">{age} Yrs, {gender}</td>
      <td className="py-3 text-sm text-gray-500">{contact}</td>
      <td className="py-3 text-sm text-teal-600 font-medium">{orders}</td>
      <td className="py-3 text-right space-x-3 whitespace-nowrap">
        <button onClick={()=>open("order", regNo) } className="text-sm text-teal-600 font-medium hover:underline cursor-pointer">
          Book test →
        </button>
        <span className="text-gray-300">·</span>
        <button onClick={()=>open("homeCollection", regNo)} className="text-sm text-teal-600 font-medium hover:underline cursor-pointer">
          Home collection →
        </button>
      </td>
    </tr>
  );
}