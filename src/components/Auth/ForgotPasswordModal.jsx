// src/components/Auth/ForgotPasswordModal.jsx
import { useState } from "react";
import ModalShell from "../common/Modal/ModalShell";
import { forgotPasswordApi } from "../../api/api";

export default function ForgotPasswordModal({ onClose }) {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!identifier.trim()) {
      setError("Enter your email.");
      return;
    }

    setError("");
    setSending(true);

    try {
      await forgotPasswordApi(identifier.trim());
      setIsSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <ModalShell title="Reset Password" onClose={onClose} maxWidth="max-w-sm">
      {isSent ? (
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            If an account exists for <span className="font-medium text-gray-900">{identifier}</span>,
            a password reset link has been sent.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-gray-500">
              Enter your email and we'll send you a link to reset your password.
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Email
              </label>
              <input
                autoFocus
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="frontofficer@lab.com"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}