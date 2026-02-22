/**
 * Logo — MailDoor brand mark.
 * Renders the app name with an accent-colored door icon.
 */
import { Mail } from "lucide-react";
import Link from "next/link";

export default function Logo({ size = "default" }) {
  const sizes = {
    small: { icon: 18, text: "text-lg" },
    default: { icon: 22, text: "text-xl" },
    large: { icon: 28, text: "text-2xl" },
  };

  const s = sizes[size] || sizes.default;

  return (
    <Link href="/" className="flex items-center gap-2 group ">
      <div className="relative">
        <img
          src="/logo.png"
          alt="MailDoor Logo"
          width={s.icon}
          height={s.icon}
          className="object-contain"
        />
      </div>
      <span
        className={`${s.text} font-semibold tracking-tight text-foreground`}
      >
        Mail<span className="text-[#70012b]">Door</span>
      </span>
    </Link>
  );
}
