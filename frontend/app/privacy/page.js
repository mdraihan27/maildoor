/**
 * Privacy Policy Page — Comprehensive privacy policy for MailDoor.
 */
import PageShell from "@/components/layout/PageShell";
import PrivacyContent from "@/components/privacy/PrivacyContent";

export const metadata = {
  title: "Privacy Policy — MailDoor",
  description:
    "How MailDoor collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-widest text-[#70012b] font-medium mb-3">
            Legal
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-3 text-sm text-muted">
            Last updated: February 23, 2026
          </p>
        </div>

        {/* Content */}
        <PrivacyContent />
      </div>
    </PageShell>
  );
}
