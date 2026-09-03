import { createContext, useContext, useState, useEffect } from "react";
import {
  loginApi,
  getMeApi,
  logoutApi,
} from "../api/api";

const AuthContext = createContext(null);

const STORAGE_KEY = "souhruda_auth_user";
const TOKEN_KEY = "souhruda_auth_token";

export function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getMeApi();

        const backendUser = data.user;

        const sessionUser = {
          id: backendUser.id,
          name: backendUser.name,
          email: backendUser.email,
          phone: backendUser.phone,
          role: backendUser.role,
          branchId: backendUser.branch_id,
          isActive: backendUser.is_active,
          staffId: backendUser.staff_id ?? null,
          branch: backendUser.branch ?? null,
          initials: getInitials(backendUser.name),
        };

        setUser(sessionUser);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(sessionUser)
        );
      } catch (error) {
        console.error("Failed to restore authentication:", error);

        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function login(email, password) {
    try {
      const data = await loginApi(email.trim(), password);

      const backendUser = data.user;

      const sessionUser = {
        id: backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        phone: backendUser.phone,
        role: backendUser.role,
        branchId: backendUser.branch_id,
        isActive: backendUser.is_active,
        staffId: backendUser.staff_id ?? null,
        branch: backendUser.branch ?? null,
        initials: getInitials(backendUser.name),
      };

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(sessionUser)
      );

      setUser(sessionUser);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Login failed. Please try again.",
      };
    }
  }

  async function logout() {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return ctx;
}
