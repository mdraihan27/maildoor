/**
 * Button — Reusable button with variants.
 * Supports primary, secondary, ghost, and danger styles.
 */
"use client";

import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-[#70012b] text-white hover:bg-[#5d0124] active:bg-[#4b011d] shadow-md shadow-[#70012b]/20",
  secondary:
    "bg-transparent border border-[#70012b]/30 text-foreground hover:bg-[#70012b]/10 hover:border-[#70012b]/50",
  ghost:
    "bg-transparent text-muted hover:text-foreground hover:bg-white/5",
  danger:
    "bg-red-900/20 text-red-400 border border-red-800/30 hover:bg-red-900/30",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
  loading,
  ...props
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium",
        "transition-all duration-200 cursor-pointer",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-2 focus:ring-[#70012b]/40 focus:ring-offset-1 focus:ring-offset-black",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
