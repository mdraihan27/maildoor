/**
 * PageShell — Wraps all pages with the global glow, navbar, and footer.
 */
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function PageShell({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Background glow */}
      <div className="md-glow" />

      {/* Navigation */}
      <Navbar />

      {/* Page content with top padding for fixed navbar */}
      <main className="relative z-10 flex-1 pt-20">{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
