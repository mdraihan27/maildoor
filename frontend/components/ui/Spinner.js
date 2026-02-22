/**
 * Spinner — Loading indicator.
 */
import { cn } from "@/lib/utils";

export default function Spinner({ size = 20, className }) {
  return (
    <svg
      className={cn("animate-spin text-[#70012b]", className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-20"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
