import { useRef, useState } from "react";
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
  // Guards against a fast double-click firing onConfirm/onClose twice (e.g.
  // two cancel API calls). `clicked` state disables the buttons visually,
  // but state only takes effect after a re-render — two clicks landing
  // before that render commits would both read the same stale `clicked`
  // value. lockedRef is a plain mutable flag, set synchronously on the very
  // first click, so the very next click (however soon) is blocked instantly
  // regardless of whether React has re-rendered yet.
  const lockedRef = useRef(false);
  const [clicked, setClicked] = useState(false);

  function handleConfirm() {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setClicked(true);
    onConfirm();
  }

  function handleClose() {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setClicked(true);
    onClose();
  }

  return (
    <ModalShell title={title} onClose={handleClose} maxWidth="max-w-sm">
      <div className="px-6 py-5">
        <p className="text-sm text-gray-600">{message}</p>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 ">
        <button
          onClick={handleClose}
          disabled={clicked}
          className={`px-4 py-2.5 rounded-lg border text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            danger
              ? "border-teal-600 text-teal-700 hover:bg-teal-50"
              : "border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {cancelLabel}
        </button>
        <button
          onClick={handleConfirm}
          disabled={clicked}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            danger ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}