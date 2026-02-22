/**
 * KeyRow — Single API key row in the keys list.
 */
"use client";

import { useState } from "react";
import { MoreVertical, Ban, Trash2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { maskApiKey, formatDate, timeAgo } from "@/lib/utils";

export default function KeyRow({ apiKey, onRevoke, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = apiKey.status === "ACTIVE";
  const isExpired =
    apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date();
  const displayStatus = isExpired && isActive ? "EXPIRED" : apiKey.status;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[#70012b]/8 bg-[#130007]/15 px-4 py-3.5 transition-colors hover:bg-[#130007]/25">
      {/* Left: Name + masked key */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium truncate">{apiKey.name}</span>
          <Badge color={displayStatus}>{displayStatus}</Badge>
        </div>
        <p className="text-xs text-muted font-mono">
          {maskApiKey(apiKey.prefix, apiKey.suffix)}
        </p>
      </div>

      {/* Center: Metadata */}
      <div className="hidden sm:flex items-center gap-6 text-xs text-muted shrink-0">
        <div>
          <span className="block text-[10px] uppercase tracking-wider text-muted/60">
            Created
          </span>
          {formatDate(apiKey.createdAt)}
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wider text-muted/60">
            Last used
          </span>
          {apiKey.lastUsedAt ? timeAgo(apiKey.lastUsedAt) : "Never"}
        </div>
        {apiKey.expiresAt && (
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-muted/60">
              Expires
            </span>
            {formatDate(apiKey.expiresAt)}
          </div>
        )}
      </div>

      {/* Right: Actions menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
        >
          <MoreVertical size={16} />
        </button>

        {menuOpen && (
          <>
            {/* Backdrop to close menu */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-lg border border-[#70012b]/15 bg-[#130007] shadow-xl shadow-black/40 py-1 animate-slide-down">
              {isActive && !isExpired && (
                <MenuButton
                  icon={Ban}
                  label="Revoke"
                  onClick={() => {
                    setMenuOpen(false);
                    onRevoke(apiKey._id);
                  }}
                />
              )}
              <MenuButton
                icon={Trash2}
                label="Delete"
                danger
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(apiKey._id);
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MenuButton({ icon: Icon, label, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer ${
        danger
          ? "text-red-400 hover:bg-red-900/20"
          : "text-muted hover:text-foreground hover:bg-white/5"
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
