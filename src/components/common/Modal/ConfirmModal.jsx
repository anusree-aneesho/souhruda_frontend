// src/components/common/Modal/ConfirmModal.jsx
import ModalShell from "./ModalShell";
import { AlertTriangle } from "lucide-react";

export default function ConfirmModal({
  title = "Confirm",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  loading = false,
}) {
  return (
    <ModalShell title={title} onClose={onClose} maxWidth="max-w-sm">
      <div className="px-6 py-6 flex flex-col items-center text-center gap-3">
        <div className="flex items-center justify-center size-12 rounded-full bg-red-50">
          <AlertTriangle className="text-red-500" size={24} />
        </div>
        <p className="text-sm text-gray-700">{message}</p>
      </div>

      <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-6 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-60"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 cursor-pointer disabled:opacity-60"
        >
          {loading ? "Deleting..." : confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}