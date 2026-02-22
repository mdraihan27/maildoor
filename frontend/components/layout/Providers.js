/**
 * Providers — Client-side providers wrapper.
 * Wraps children with AuthProvider and ToastProvider.
 */
"use client";

import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/Toast";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
