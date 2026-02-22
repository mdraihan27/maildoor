/**
 * Input — Styled text input for forms.
 */
"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { label, error, className, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-muted tracking-wide uppercase">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg px-3 py-2 text-sm",
          "bg-[#130007]/50 border border-[#70012b]/20",
          "text-foreground placeholder:text-muted/50",
          "focus:outline-none focus:border-[#70012b]/50 focus:ring-1 focus:ring-[#70012b]/30",
          "transition-colors duration-200",
          error && "border-red-500/50 focus:border-red-500/70",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
});

export default Input;
