/**
 * Footer — Minimal site footer.
 */
import Link from "next/link";
import Logo from "@/components/ui/Logo";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#70012b]/10 mt-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <Logo size="small" className=""/>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs text-muted">
            <Link href="/docs" className="hover:text-foreground transition-colors">
              Docs
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>

          {/* Copyright */}
          <p className="text-xs text-muted/60">
            &copy; {year} MailDoor. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
