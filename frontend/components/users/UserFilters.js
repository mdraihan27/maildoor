/**
 * UserFilters — Filter controls for the admin user list.
 */
"use client";

import { cn } from "@/lib/utils";

const statuses = ["ALL", "ACTIVE", "SUSPENDED"];
const roles = ["ALL", "USER", "ADMIN", "SUPERADMIN"];

export default function UserFilters({ filters, onChange }) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {/* Status filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted/60 mr-1">
          Status
        </span>
        {statuses.map((s) => (
          <FilterChip
            key={s}
            active={filters.status === s || (s === "ALL" && !filters.status)}
            onClick={() =>
              onChange({ ...filters, status: s === "ALL" ? "" : s })
            }
          >
            {s}
          </FilterChip>
        ))}
      </div>

      {/* Role filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted/60 mr-1">
          Role
        </span>
        {roles.map((r) => (
          <FilterChip
            key={r}
            active={filters.role === r || (r === "ALL" && !filters.role)}
            onClick={() =>
              onChange({ ...filters, role: r === "ALL" ? "" : r })
            }
          >
            {r}
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
