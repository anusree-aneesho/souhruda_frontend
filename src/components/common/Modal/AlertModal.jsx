// src/components/common/Modal/AlertModal.jsx
import ModalShell from "./ModalShell";
import { AlertCircle } from "lucide-react";

// Notice popup with a single OK button. Pass `onConfirm` to turn it into a
// confirmation popup with Cancel + confirm buttons.
export default function AlertModal({
  title = "Notice",
  message,
  onClose,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}) {
  return (
    <ModalShell title={title} onClose={onClose} maxWidth="max-w-sm">
      <div className="px-6 py-6 flex flex-col items-center text-center gap-3">
        <div className="flex items-center justify-center size-12 rounded-full bg-red-50">
          <AlertCircle className="text-red-500" size={24} />
        </div>
        <p className="text-sm text-gray-700">{message}</p>
      </div>

      <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-gray-100">
        {onConfirm && (
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onConfirm || onClose}
          className="px-6 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer"
        >
          {onConfirm ? confirmLabel : "OK"}
        </button>
      </div>
    </ModalShell>
  );
}