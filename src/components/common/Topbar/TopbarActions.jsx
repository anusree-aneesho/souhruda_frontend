// src/components/common/Topbar/TopbarActions.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";
import { Bell, LogOut, KeyRound } from "lucide-react";
import { requestProfilePasswordResetApi } from "../../../api/api";

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function TopbarActions() {
  const now = useLiveClock();
  const date = now.toLocaleDateString("en-GB"); // 13/08/2026
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  async function handleResetPassword() {
    setSendingReset(true);
    setResetMessage("");
    try {
      await requestProfilePasswordResetApi();
      setResetMessage("Reset link sent to your email.");
    } catch (err) {
      setResetMessage(err.message || "Failed to send reset link.");
    } finally {
      setSendingReset(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <p className="text-sm text-gray-500">
        {date} <span className="ml-1">{time}</span>
      </p>

      <button className="relative text-gray-500 hover:text-gray-700">
        <Bell size={20} />
        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" />
      </button>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="h-9 w-9 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-teal-700 transition-colors"
        >
          {user?.initials || "?"}
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-20">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              {user?.branch && (
                <p className="text-xs text-gray-400 mt-0.5">{user.branch}</p>
              )}
            </div>

            <button
              onClick={handleResetPassword}
              disabled={sendingReset}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <KeyRound size={15} />
              {sendingReset ? "Sending..." : "Reset Password"}
            </button>

            {resetMessage && (
              <p className="px-4 py-1.5 text-xs text-gray-500">{resetMessage}</p>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}