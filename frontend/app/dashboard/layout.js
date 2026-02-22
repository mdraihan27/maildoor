/**
 * Dashboard Layout — Wraps all /dashboard/* pages.
 * Requires authentication; redirects to home if not logged in.
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import PageShell from "@/components/layout/PageShell";
import Spinner from "@/components/ui/Spinner";

export default function DashboardLayout({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/");
    }
  }, [loading, isAuthenticated, router]);

  /* Show loading state while checking auth */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={28} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <PageShell>{children}</PageShell>;
}
