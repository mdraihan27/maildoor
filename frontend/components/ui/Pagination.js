/**
 * Pagination — Page navigation for lists.
 */
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      {/* Previous */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={cn(
          "p-2 rounded-lg transition-colors cursor-pointer",
          page <= 1
            ? "text-muted/30 cursor-not-allowed"
            : "text-muted hover:text-foreground hover:bg-white/5"
        )}
      >
        <ChevronLeft size={16} />
      </button>

      {/* Page numbers */}
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(
          (p) =>
            p === 1 || p === totalPages || Math.abs(p - page) <= 1
        )
        .reduce((acc, p, idx, arr) => {
          if (idx > 0 && p - arr[idx - 1] > 1) {
            acc.push("ellipsis-" + p);
          }
          acc.push(p);
          return acc;
        }, [])
        .map((item) =>
          typeof item === "string" ? (
            <span key={item} className="px-1 text-muted/50">
              ···
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              className={cn(
                "min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                item === page
                  ? "bg-[#70012b] text-white"
                  : "text-muted hover:text-foreground hover:bg-white/5"
              )}
            >
              {item}
            </button>
          )
        )}

      {/* Next */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={cn(
          "p-2 rounded-lg transition-colors cursor-pointer",
          page >= totalPages
            ? "text-muted/30 cursor-not-allowed"
            : "text-muted hover:text-foreground hover:bg-white/5"
        )}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
