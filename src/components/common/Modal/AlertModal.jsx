// src/components/common/Modal/AlertModal.jsx
import ModalShell from "./ModalShell";
import { AlertCircle } from "lucide-react";

export default function AlertModal({ title = "Notice", message, onClose }) {
  return (
    <ModalShell title={title} onClose={onClose} maxWidth="max-w-sm">
      <div className="px-6 py-6 flex flex-col items-center text-center gap-3">
        <div className="flex items-center justify-center size-12 rounded-full bg-red-50">
          <AlertCircle className="text-red-500" size={24} />
        </div>
        <p className="text-sm text-gray-700">{message}</p>
      </div>

      <div className="flex items-center justify-center px-6 py-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer"
        >
          OK
        </button>
      </div>
    </ModalShell>
  );
}