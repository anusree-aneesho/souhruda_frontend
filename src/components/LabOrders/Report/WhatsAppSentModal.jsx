// src/components/LabOrders/Report/WhatsAppSentModal.jsx
import { MessageCircle } from "lucide-react";
import ModalShell from "../../common/Modal/ModalShell";
export default function WhatsAppSentModal({ patientName, onClose }) {
  return (
    <ModalShell title="Report Sent" onClose={onClose} maxWidth="max-w-sm">
      <div className="px-6 py-6 text-center">
        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <MessageCircle size={22} className="text-green-600" />
        </div>
        <p className="text-sm text-gray-700">
          Report sent to <span className="font-semibold text-gray-900">{patientName}</span> via WhatsApp.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-4 border-t border-gray-100">
        <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700">
          Done
        </button>
      </div>
    </ModalShell>
  );
}