// src/components/Auth/ForgotPasswordModal.jsx
import { useState } from "react";
import ModalShell from "../common/Modal/ModalShell";

export default function ForgotPasswordModal({ onClose }) {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [isSent, setIsSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Enter your Front Officer ID or email.");
      return;
    }
    setError("");
    // NOTE (demo build): there is no backend wired up yet, so this just
    // confirms the request was received. Once a real API exists, swap this
    // out for an actual POST /auth/forgot-password call that emails a reset link.
    setIsSent(true);
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
              Enter your Front Officer ID or email and we'll send you a link to reset your password.
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Front Officer ID or Email
              </label>
              <input
                autoFocus
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="FO-001 or frontofficer@lab.com"
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
              className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer"
            >
              Send Reset Link
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}
