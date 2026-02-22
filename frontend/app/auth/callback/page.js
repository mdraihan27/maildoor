/**
 * Auth Callback Page — Handles the OAuth redirect from Google.
 * Extracts the JWT token from the URL and authenticates the user.
 */
"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Spinner from "@/components/ui/Spinner";
import { Suspense } from "react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleCallback } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get("token");
    if (token) {
      handleCallback(token).then(() => {
        router.replace("/dashboard");
      });
    } else {
      router.replace("/");
    }
  }, [searchParams, handleCallback, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <Spinner size={32} />
        <p className="text-sm text-muted">Authenticating...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-black">
          <Spinner size={32} />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
