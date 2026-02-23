/**
 * Navbar — Transparent navigation bar (no background).
 * Shows auth-aware navigation items.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  LogOut,
  ScrollText,
  Key,
  Activity,
  User,
  BookOpen,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import TermsModal from "@/components/ui/TermsModal";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, loginWithGoogle, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Logo />

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <NavLink href="/dashboard" icon={Activity}>
                Dashboard
              </NavLink>
              <NavLink href="/dashboard/api-keys" icon={Key}>
                API Keys
              </NavLink>
              <NavLink href="/dashboard/audit" icon={ScrollText}>
                Logs
              </NavLink>
              <NavLink href="/docs" icon={BookOpen}>
                Docs
              </NavLink>
              {isAdmin && (
                <NavLink href="/dashboard/users" icon={User}>
                  Users
                </NavLink>
              )}

              {/* User menu */}
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-[#70012b]/20">
                <span className="text-xs text-muted truncate max-w-[120px]">
                  {user?.name || user?.email}
                </span>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink href="/docs">Docs</NavLink>
              <NavLink href="/terms">Terms</NavLink>
              <NavLink href="/privacy">Privacy Policy</NavLink>
              <button
                onClick={() => setTermsOpen(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[#70012b] text-white hover:bg-[#5d0124] transition-colors cursor-pointer"
              >
                Sign in with Google
              </button>
            </>
          )}
        </div>

        {/* Terms agreement modal */}
        <TermsModal
          open={termsOpen}
          onClose={() => setTermsOpen(false)}
          onAccept={() => {
            setTermsOpen(false);
            loginWithGoogle();
          }}
        />

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#70012b]/10 bg-black/95 backdrop-blur-lg animate-slide-down">
          <div className="px-6 py-4 flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                <MobileLink href="/dashboard" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </MobileLink>
                <MobileLink href="/dashboard/api-keys" onClick={() => setMobileOpen(false)}>
                  API Keys
                </MobileLink>
                <MobileLink href="/dashboard/audit" onClick={() => setMobileOpen(false)}>
                  Site-wide Logs
                </MobileLink>
                <MobileLink href="/docs" onClick={() => setMobileOpen(false)}>
                  Docs
                </MobileLink>
                {isAdmin && (
                  <MobileLink href="/dashboard/users" onClick={() => setMobileOpen(false)}>
                    Users
                  </MobileLink>
                )}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="text-left text-sm text-red-400 py-2 cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <MobileLink href="/docs" onClick={() => setMobileOpen(false)}>
                  Docs
                </MobileLink>
                <MobileLink href="/terms" onClick={() => setMobileOpen(false)}>
                  Terms
                </MobileLink>
                <MobileLink href="/privacy" onClick={() => setMobileOpen(false)}>
                  Privacy Policy
                </MobileLink>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setTermsOpen(true);
                  }}
                  className="mt-2 w-full py-2 rounded-lg bg-[#70012b] text-white text-sm font-medium cursor-pointer"
                >
                  Sign in with Google
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─── Nav sub-components ──────────────────────────────── */

function NavLink({ href, icon: Icon, children }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors md-link"
    >
      {Icon && <Icon size={14} />}
      {children}
    </Link>
  );
}

function MobileLink({ href, children, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-sm text-muted hover:text-foreground py-2 transition-colors"
    >
      {children}
    </Link>
  );
}
