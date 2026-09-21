// src/components/common/RequireRole.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

export default function RequireRole({ roles, children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null; // wait until the session is restored

  const role = String(user?.role ?? "").toLowerCase().trim().replace(/[\s-]+/g, "_");
  return roles.includes(role) ? children : <Navigate to="/" replace />;
}