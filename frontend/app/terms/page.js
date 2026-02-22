/**
 * Terms & Conditions Page — Legal terms for MailDoor.
 */
import PageShell from "@/components/layout/PageShell";
import TermsContent from "@/components/terms/TermsContent";

export const metadata = {
  title: "Terms & Conditions — MailDoor",
  description: "MailDoor terms of service, privacy, and acceptable use policies.",
};

export default function TermsPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-widest text-[#70012b] font-medium mb-3">
            Legal
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Terms & Conditions
          </h1>
          <p className="mt-3 text-sm text-muted">
            Last updated: February 22, 2026
          </p>
        </div>

        {/* Content */}
        <TermsContent />
      </div>
    </PageShell>
  );
}
