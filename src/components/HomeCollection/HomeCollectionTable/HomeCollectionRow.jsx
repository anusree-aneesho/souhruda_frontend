// src/components/HomeCollection/HomeCollectionTable/HomeCollectionRow.jsx
import { useHomeCollectionModal } from "../../../Context/HomeCollectionModalContext";
import StatusBadge from "../../Dashboard/TodaysOrders/StatusBadge";

export default function HomeCollectionRow({ requestId, patient, tests, distance, date, slot, payment, technician, status }) {
  const paymentStyles = {
    Card: "bg-amber-100 text-amber-700",
    Cash: "bg-orange-100 text-orange-700",
    UPI: "bg-blue-100 text-blue-700",
  };
   const { open } = useHomeCollectionModal();

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 text-sm text-teal-600 font-medium">{requestId}</td>
      <td className="py-3 text-sm font-medium text-gray-900">{patient}</td>
      <td className="py-3 text-sm text-gray-500">{tests} tests</td>
      <td className="py-3 text-sm text-gray-500">{distance}</td>
      <td className="py-3 text-sm text-gray-700">
        {date}
        <p className="text-xs text-gray-400">{slot}</p>
      </td>
      <td className="py-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${paymentStyles[payment]}`}>
          {payment}
        </span>
      </td>
      <td className="py-3 text-sm text-gray-700">{technician}</td>
      <td className="py-3">
        <StatusBadge status={status} />
      </td>
      <td className="py-3 text-right">
        <button onClick={()=>open(requestId)} className="text-sm text-teal-600 font-medium hover:underline">
          Open →
        </button>
      </td>
    </tr>
  );
}