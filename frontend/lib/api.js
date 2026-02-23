/**
 * API client for MailDoor backend.
 * Handles token management, automatic refresh, and consistent error handling.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/* ─── Token Storage (client-side only) ────────────────── */
let accessToken = null;

export const setToken = (token) => {
  accessToken = token;
  if (typeof window !== "undefined") {
    localStorage.setItem("md_token", token);
  }
};

export const getToken = () => {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    accessToken = localStorage.getItem("md_token");
  }
  return accessToken;
};

export const clearToken = () => {
  accessToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("md_token");
  }
};

/* ─── Core Fetch Wrapper ──────────────────────────────── */
async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // send httpOnly cookies (refreshToken)
  });

  // Handle 401 — attempt token refresh once
  if (res.status === 401 && !options._retried) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return request(path, { ...options, _retried: true });
    }
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    throw new Error("Session expired");
  }

  // 204 No Content
  if (res.status === 204) return { success: true };

  const data = await res.json();
  if (!data.success) {
    const err = new Error(data.error?.message || "Request failed");
    err.code = data.error?.code;
    err.status = res.status;
    err.details = data.error?.details;
    throw err;
  }

  return data;
}

/* ─── Token Refresh ───────────────────────────────────── */
async function refreshTokens() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.success && data.data?.accessToken) {
      setToken(data.data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/* ─── Auth ────────────────────────────────────────────── */
export const auth = {
  /** Returns the Google OAuth URL to redirect to */
  getGoogleUrl: () => `${API_BASE}/api/auth/google`,

  /** Refresh JWT pair */
  refresh: () => refreshTokens(),

  /** Logout — clear cookies and local token */
  logout: () => request("/api/auth/logout", { method: "POST" }),
};

/* ─── Users ───────────────────────────────────────────── */
export const users = {
  /** Get current authenticated user */
  me: () => request("/api/users/me"),

  /** Update current user profile */
  updateMe: (body) =>
    request("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  /** Set or update Gmail App Password */
  setAppPassword: (appPassword) =>
    request("/api/users/me/app-password", {
      method: "PUT",
      body: JSON.stringify({ appPassword }),
    }),

  /** Remove Gmail App Password */
  removeAppPassword: () =>
    request("/api/users/me/app-password", { method: "DELETE" }),

  /** Check if App Password is configured */
  appPasswordStatus: () =>
    request("/api/users/me/app-password/status"),

  /** Verify App Password works */
  verifyAppPassword: (appPassword) =>
    request("/api/users/me/app-password/verify", {
      method: "POST",
      body: JSON.stringify({ appPassword }),
    }),

  /** List users (admin) */
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/users?${qs}`);
  },

  /** Get user by ID (admin) */
  getById: (id) => request(`/api/users/${id}`),

  /** Change user role (superadmin) */
  changeRole: (id, role) =>
    request(`/api/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  /** Suspend user (admin) */
  suspend: (id) =>
    request(`/api/users/${id}/suspend`, { method: "PATCH" }),

  /** Reactivate user (admin) */
  reactivate: (id) =>
    request(`/api/users/${id}/reactivate`, { method: "PATCH" }),
};

/* ─── API Keys ────────────────────────────────────────── */
export const apiKeys = {
  /** Create a new API key */
  create: (body) =>
    request("/api/api-keys", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** List API keys */
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/api-keys?${qs}`);
  },

  /** Revoke an API key */
  revoke: (id) =>
    request(`/api/api-keys/${id}/revoke`, { method: "PATCH" }),

  /** Delete an API key permanently */
  delete: (id) =>
    request(`/api/api-keys/${id}`, { method: "DELETE" }),
};

/* ─── Logs (Audit) ────────────────────────────────────── */
export const audit = {
  /** Get current user's audit logs */
  me: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/audit/me?${qs}`);
  },

  /** List all audit logs (admin) */
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/audit?${qs}`);
  },
};
