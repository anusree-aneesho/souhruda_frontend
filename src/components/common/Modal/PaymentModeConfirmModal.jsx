import { useState } from "react";
import { Smartphone, Banknote, CreditCard } from "lucide-react";
import ModalShell from "./ModalShell";
import QrCode from "../QrCode";

const UPI_ID = "souhruda@upi"; // put your lab's real UPI ID

const MODES = [
  { id: "upi", label: "UPI", Icon: Smartphone },
  { id: "cash", label: "Cash", Icon: Banknote },
  { id: "card", label: "Card", Icon: CreditCard },
];

export default function PaymentModeConfirmModal({
  title = "Confirm Payment",
  message,
  amount,
  onClose,
  onConfirm, // called with "upi" | "cash" | "card"
  confirmLabel = "Yes, mark as paid",
  cancelLabel = "Cancel",
}) {
  const [mode, setMode] = useState("cash");
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=Souhruda&am=${Number(amount || 0).toFixed(2)}&cu=INR`;

  return (
    <ModalShell title={title} onClose={onClose} maxWidth="max-w-md">
      <div className="px-6 py-6 flex flex-col items-center text-center gap-4">
        <p className="text-sm text-gray-700">{message}</p>

        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Payment mode</p>
          <div role="radiogroup" aria-label="Payment mode" className="flex gap-2">
            {MODES.map(({ id, label, Icon }) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMode(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                    active ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {mode === "upi" && (
          <div className="w-full rounded-xl border border-gray-100 bg-gray-50 px-5 py-5 flex flex-col items-center">
            <QrCode value={upiLink} size={176} />
            <p className="mt-3 text-sm font-semibold text-gray-900">
              {amount != null ? `Scan to pay ₹${Number(amount).toFixed(2)}` : "Scan to pay"}
            </p>
            <p className="mt-1 text-xs text-gray-400">{UPI_ID}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => onConfirm(mode)}
          className="px-5 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer"
        >
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}