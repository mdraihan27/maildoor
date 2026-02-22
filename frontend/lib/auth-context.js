/**
 * AuthContext — Provides authentication state and actions to the app.
 * Wraps the API client for easy access to user data and auth methods.
 */
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { users as usersApi, auth as authApi, setToken, clearToken, getToken } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /** Fetch the current user profile */
  const fetchUser = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const { data } = await usersApi.me();
      setUser(data);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Login via Google — redirect to backend OAuth */
  const loginWithGoogle = useCallback(() => {
    window.location.href = authApi.getGoogleUrl();
  }, []);

  /** Logout — clear session */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      clearToken();
      setUser(null);
      window.location.href = "/";
    }
  }, []);

  /** Handle OAuth callback token */
  const handleCallback = useCallback(
    async (token) => {
      setToken(token);
      await fetchUser();
    },
    [fetchUser]
  );

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN" || user?.role === "SUPERADMIN",
    isSuperAdmin: user?.role === "SUPERADMIN",
    loginWithGoogle,
    logout,
    handleCallback,
    refreshUser: fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
