/**
 * HeroSection — Landing page hero with headline, description, and CTA.
 */
"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import TermsModal from "@/components/ui/TermsModal";

export default function HeroSection() {
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <section className="relative flex flex-col items-center justify-center px-6 pt-36 pb-24 text-center">
      {/* Headline */}
      <h1 className="max-w-3xl text-4xl md:text-6xl font-bold tracking-tight leading-tight animate-fade-in">
        Gmail service for servers that{" "}
        <span className="bg-gradient-to-r from-[#70012b] to-[#5d0124] bg-clip-text text-transparent">
          block SMTP
        </span>
      </h1>

      {/* Subheadline */}
      <p className="mt-6 max-w-xl text-base text-muted leading-relaxed animate-fade-in" style={{ animationDelay: "0.1s" }}>
        DigitalOcean blocks SMTP, so you can&apos;t run mail service with your gmail on your
        droplet. With MailDoor, you connect your Gmail and send emails through
        our API instead. We sent that mail using your gmail.
      </p>

      {/* CTA */}
      <div className="mt-10 flex items-center gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        {isAuthenticated ? (
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-[#70012b] px-6 py-3 text-sm font-medium text-white hover:bg-[#5d0124] transition-colors"
          >
            Go to Dashboard
            <ArrowRight size={16} />
          </a>
        ) : (
          <button
            onClick={() => setTermsOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#70012b] px-6 py-3 text-sm font-medium text-white hover:bg-[#5d0124] transition-colors cursor-pointer"
          >
            Get started with Google
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* Terms agreement modal */}
      {!isAuthenticated && (
        <TermsModal
          open={termsOpen}
          onClose={() => setTermsOpen(false)}
          onAccept={() => {
            setTermsOpen(false);
            loginWithGoogle();
          }}
        />
      )}
    </section>
  );
}
