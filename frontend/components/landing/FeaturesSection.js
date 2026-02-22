/**
 * FeaturesSection — Grid of features on the landing page.
 */
import {
  Lock,
  Key,
  Activity,
  Users,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "Google OAuth",
    description:
      "No passwords to manage. Sign in securely with your Google account via OAuth 2.0.",
  },
  {
    icon: Key,
    title: "API Key Management",
    description:
      "Generate, revoke, and rotate API keys. SHA-256 hashed, shown only once, with IP allowlists.",
  },
  {
    icon: Activity,
    title: "Audit Logging",
    description:
      "Every action is tracked — logins, key usage, emails sent, role changes, all with 90-day retention.",
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Access",
    description:
      "Three-tier permission model: User, Admin, and Superadmin with granular access controls.",
  },
  {
    icon: RefreshCw,
    title: "Token Rotation",
    description:
      "JWTs auto-refresh. Google refresh tokens encrypted at rest with AES-256-GCM.",
  },
  {
    icon: Users,
    title: "User Management",
    description:
      "Admins can list users, suspend accounts, and manage roles through a clean interface.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest text-[#70012b] font-medium mb-3">
            Features
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">
            Everything you need, nothing you don&apos;t
          </h2>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="group rounded-xl border border-[#70012b]/10 bg-[#130007]/20 p-6 transition-all duration-300 hover:border-[#70012b]/25 hover:bg-[#130007]/40">
      <div className="mb-4 inline-flex rounded-lg bg-[#70012b]/10 p-2.5">
        <Icon
          size={20}
          className="text-[#70012b] transition-colors group-hover:text-[#e0a0b8]"
        />
      </div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <p className="text-xs text-muted leading-relaxed">{description}</p>
    </div>
  );
}
