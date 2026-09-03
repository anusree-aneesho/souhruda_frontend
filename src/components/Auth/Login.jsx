// src/components/Auth/Login.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogIn } from "lucide-react";
import AuthLayout from "./AuthLayout";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { useAuth } from "../../Context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password.trim()) {
      setError("Enter your Front Officer ID or email, and your password.");
      return;
    }

    setIsSubmitting(true);
    const result = await login(identifier, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    navigate(redirectTo, { replace: true });
  }

  return (
    <AuthLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Sign in</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter your front officer credentials to access the dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-gray-900">
              Password
            </label>
            <button
              type="button"
              onClick={() => setForgotPasswordOpen(true)}
              className="text-xs font-medium text-teal-600 hover:underline cursor-pointer"
            >
              Reset password?
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-60 cursor-pointer"
        >
          <LogIn size={16} />
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-100">
        <p className="text-xs text-gray-400 leading-relaxed">
          Demo build — try <span className="font-medium text-gray-500">FO-001</span> or{" "}
          <span className="font-medium text-gray-500">frontofficer@lab.com</span> with any password.
          Front Officer records live in <code className="text-gray-500">src/data/staff.js</code> for
          now; a real backend will replace this with proper authentication.
        </p>
      </div>

      {isForgotPasswordOpen && (
        <ForgotPasswordModal onClose={() => setForgotPasswordOpen(false)} />
      )}
    </AuthLayout>
  );
}
