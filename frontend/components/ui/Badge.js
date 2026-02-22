/**
 * Badge — Small label for statuses, roles, categories.
 */
import { cn } from "@/lib/utils";

const colorMap = {
  /* Status */
  ACTIVE: "bg-emerald-900/30 text-emerald-400 border-emerald-800/40",
  SUSPENDED: "bg-red-900/30 text-red-400 border-red-800/40",
  REVOKED: "bg-amber-900/30 text-amber-400 border-amber-800/40",
  EXPIRED: "bg-zinc-800/50 text-zinc-400 border-zinc-700/40",

  /* Roles */
  USER: "bg-sky-900/30 text-sky-400 border-sky-800/40",
  ADMIN: "bg-violet-900/30 text-violet-400 border-violet-800/40",
  SUPERADMIN: "bg-[#70012b]/20 text-[#f0a0c0] border-[#70012b]/40",

  /* Audit categories */
  AUTH: "bg-blue-900/30 text-blue-400 border-blue-800/40",
  APIKEY: "bg-amber-900/30 text-amber-400 border-amber-800/40",
  EMAIL: "bg-emerald-900/30 text-emerald-400 border-emerald-800/40",

  /* Outcomes */
  SUCCESS: "bg-emerald-900/30 text-emerald-400 border-emerald-800/40",
  FAILURE: "bg-red-900/30 text-red-400 border-red-800/40",

  /* Default */
  default: "bg-zinc-800/50 text-zinc-400 border-zinc-700/40",
};

export default function Badge({ children, color, className }) {
  const classes = colorMap[color] || colorMap.default;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider rounded-md border",
        classes,
        className
      )}
    >
      {children}
    </span>
  );
}
