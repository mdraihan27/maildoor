/**
 * AuditFilters — Filter controls for audit log listing.
 */
"use client";

import { cn } from "@/lib/utils";

const categories = ["ALL", "APIKEY", "EMAIL"];
const outcomes = ["ALL", "SUCCESS", "FAILURE"];

export default function AuditFilters({ filters, onChange }) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {/* Category filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted/60 mr-1">
          Category
        </span>
        {categories.map((cat) => (
          <FilterChip
            key={cat}
            active={filters.category === cat || (cat === "ALL" && !filters.category)}
            onClick={() =>
              onChange({ ...filters, category: cat === "ALL" ? "" : cat })
            }
          >
            {cat}
          </FilterChip>
        ))}
      </div>

      {/* Outcome filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted/60 mr-1">
          Outcome
        </span>
        {outcomes.map((out) => (
          <FilterChip
            key={out}
            active={filters.outcome === out || (out === "ALL" && !filters.outcome)}
            onClick={() =>
              onChange({ ...filters, outcome: out === "ALL" ? "" : out })
            }
          >
            {out}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}

function FilterChip({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
        active
          ? "bg-[#70012b]/20 text-[#e0a0b8] border border-[#70012b]/30"
          : "text-muted hover:text-foreground hover:bg-white/5 border border-transparent"
      )}
    >
      {children}
    </button>
  );
}
