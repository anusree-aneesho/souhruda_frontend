// src/components/common/Modal/ConfirmModal.jsx
import ModalShell from "./ModalShell";
import { AlertTriangle } from "lucide-react";

export default function ConfirmModal({
  title = "Confirm",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  loadingLabel = "Please wait...",
  onConfirm,
  onClose,
  loading = false,
  variant = "default", // "default" = centered with icon, "simple" = left text, right buttons
}) {
  const isSimple = variant === "simple";

  return (
    <ModalShell title={title} onClose={onClose} maxWidth={isSimple ? "max-w-md" : "max-w-sm"}>
      {isSimple ? (
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-sm text-gray-700">{message}</p>
        </div>
      ) : (
        <div className="px-6 py-6 flex flex-col items-center text-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-full bg-red-50">
            <AlertTriangle className="text-red-500" size={24} />
          </div>
          <p className="text-sm text-gray-700">{message}</p>
        </div>
      )}

      <div
        className={
          isSimple
            ? "flex items-center justify-end gap-3 px-6 py-4"
            : "flex items-center justify-center gap-3 px-6 py-4 border-t border-gray-100"
        }
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className={
            isSimple
              ? "px-5 py-2 rounded-lg border border-teal-600 bg-white text-sm font-semibold text-teal-700 hover:bg-teal-50 cursor-pointer disabled:opacity-60"
              : "px-6 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-60"
          }
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={
            isSimple
              ? "px-5 py-2 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 cursor-pointer disabled:opacity-60"
              : "px-6 py-2.5 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 cursor-pointer disabled:opacity-60"
          }
        >
          {loading ? loadingLabel : confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}