import ModalShell from "../../../components/common/Modal/ModalShell";

export default function ConfirmModal({
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onClose,
}) {
  return (
    <ModalShell title={title} onClose={onClose} maxWidth="max-w-sm">
      <div className="px-6 py-5">
        <p className="text-sm text-gray-600">{message}</p>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium text-white ${
            danger ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}