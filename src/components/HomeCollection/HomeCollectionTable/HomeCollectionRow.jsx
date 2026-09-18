// src/components/HomeCollection/HomeCollectionTable/HomeCollectionRow.jsx
import { useState } from "react";
import { useHomeCollectionModal } from "../../../Context/HomeCollectionModalContext";
import StatusBadge from "../../Dashboard/TodaysOrders/StatusBadge";
import { updateHomeCollectionStatusApi } from "../../../api/api";

export default function HomeCollectionRow({ requestId, patient, tests, distance, date, slot, payment, technician, status, onCancelled }) {
  const paymentStyles = {
    Card: "bg-amber-100 text-amber-700",
    Cash: "bg-orange-100 text-orange-700",
    UPI: "bg-blue-100 text-blue-700",
  };
   const { open } = useHomeCollectionModal();
   const [isCancelling, setIsCancelling] = useState(false);

   // A technician can only be assigned to a request that's still
   // "Requested" — once that happens (Assigned, En Route, ...) the request
   // is no longer cancellable, so the button stays disabled from then on.
   const canCancel = status === "Requested";

   async function handleCancel() {
     if (!window.confirm(`Cancel request ${requestId}? This can't be undone.`)) return;

     setIsCancelling(true);
     try {
       await updateHomeCollectionStatusApi(requestId, "cancelled");
       onCancelled?.();
     } catch (err) {
       alert(err.message || "Couldn't cancel this request.");
       setIsCancelling(false);
     }
   }

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
      <td className="py-3">
        <button
          onClick={handleCancel}
          disabled={!canCancel || isCancelling}
          title={canCancel ? undefined : "A technician has already been assigned — this request can no longer be cancelled."}
          className="text-xs font-medium text-red-600 hover:underline disabled:text-gray-300 disabled:cursor-not-allowed disabled:no-underline"
        >
          {isCancelling ? "Cancelling…" : "Cancel"}
        </button>
      </td>
      <td className="py-3 text-right">
        <button onClick={()=>open(requestId)} className="text-sm text-teal-600 font-medium hover:underline cursor-pointer">
          Open →
        </button>
      </td>
    </tr>
  );
}