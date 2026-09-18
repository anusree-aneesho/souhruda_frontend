// src/components/HomeCollection/HomeCollectionTable/HomeCollectionRow.jsx
import { useState } from "react";
import { useHomeCollectionModal } from "../../../Context/HomeCollectionModalContext";
import StatusBadge from "../../Dashboard/TodaysOrders/StatusBadge";
import ConfirmModal from "../../Patients/modals/ConfirmModal";
import AlertModal from "../../common/Modal/AlertModal";
import Toast from "../../common/Toast/Toast";
import { useToast } from "../../common/Toast/useToast";
import { updateHomeCollectionStatusApi } from "../../../api/api";

export default function HomeCollectionRow({ requestId, patient, tests, distance, date, slot, payment, technician, status, onCancelled }) {
  const paymentStyles = {
    Card: "bg-amber-100 text-amber-700",
    Cash: "bg-orange-100 text-orange-700",
    UPI: "bg-blue-100 text-blue-700",
  };
   const { open } = useHomeCollectionModal();
   const [isCancelling, setIsCancelling] = useState(false);
   const [confirmingCancel, setConfirmingCancel] = useState(false);
   const [cancelError, setCancelError] = useState(null);
   const { toast, showToast, hideToast } = useToast();

   // A technician can only be assigned to a request that's still
   // "Requested" — once that happens (Assigned, En Route, ...) the request
   // is no longer cancellable, so the button stays disabled from then on.
   const canCancel = status === "Requested";

   async function confirmCancel() {
     setConfirmingCancel(false);
     setIsCancelling(true);
     try {
       await updateHomeCollectionStatusApi(requestId, "cancelled");
       onCancelled?.();
       showToast(`${requestId} cancelled for ${patient}`);
     } catch (err) {
       setCancelError(err.message || "Couldn't cancel this request.");
     } finally {
       // Reset regardless of outcome — on success the row re-renders with
       // status "Cancelled" (via onCancelled's refetch) and the button
       // disables itself from that, but this component instance stays
       // mounted (same requestId key), so without this reset it would keep
       // showing "Cancelling…" forever instead of picking up the new state.
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
          onClick={() => setConfirmingCancel(true)}
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

      {confirmingCancel && (
        <ConfirmModal
          title="Cancel Request"
          message={`Cancel request ${requestId}? This can't be undone.`}
          confirmLabel="Cancel Request"
          cancelLabel="Keep Request"
          danger
          onConfirm={confirmCancel}
          onClose={() => setConfirmingCancel(false)}
        />
      )}

      {cancelError && (
        <AlertModal title="Couldn't Cancel" message={cancelError} onClose={() => setCancelError(null)} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </tr>
  );
}