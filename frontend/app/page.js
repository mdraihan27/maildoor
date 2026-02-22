/**
 * Home Page — MailDoor landing page.
 * Combines hero, features, how-it-works, and footer.
 */
import PageShell from "@/components/layout/PageShell";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";

export default function HomePage() {
  return (
    <PageShell>
      <HeroSection />
      <HowItWorksSection />
    </PageShell>
  );
}
