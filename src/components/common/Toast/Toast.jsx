// src/components/common/Toast/Toast.jsx
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle } from "lucide-react";

export default function Toast({ message, type = "success", duration = 3000, onClose }) {

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const isSuccess = type === "success";

  return createPortal(
    <div
      role="alert"
      className={`fixed bottom-24 right-6 z-50 flex items-start gap-2 rounded-lg px-4 py-3 shadow-lg text-sm font-medium text-white max-w-sm ${
        isSuccess ? "bg-teal-600" : "bg-red-500"
      }`}
    >
      {isSuccess ? (
        <CheckCircle size={18} className="shrink-0 mt-0.5" />
      ) : (
        <XCircle size={18} className="shrink-0 mt-0.5" />
      )}
      <span className="line-clamp-2">{message}</span>
    </div>,
    document.body
  );
}