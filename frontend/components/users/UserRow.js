/**
 * UserRow — Single user entry in the admin users list.
 */
"use client";

import { useState } from "react";
import Image from "next/image";
import { MoreVertical, ShieldCheck, ShieldOff, UserCog } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export default function UserRow({
  user,
  currentUserId,
  isSuperAdmin,
  onSuspend,
  onReactivate,
  onChangeRole,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isSelf = user._id === currentUserId;

  return (
    <div className="flex items-center justify-between gap-3 sm:gap-4 rounded-lg border border-[#70012b]/8 bg-[#130007]/15 px-3 sm:px-4 py-3 sm:py-3.5 transition-colors hover:bg-[#130007]/25">
      {/* Left: Avatar + info */}
      <div className="flex items-center gap-3 min-w-0">
        {user.profilePicture ? (
          <Image
            src={user.profilePicture}
            alt={user.name}
            width={36}
            height={36}
            className="rounded-full border border-[#70012b]/20 shrink-0"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-[#70012b]/20 flex items-center justify-center text-sm font-semibold text-[#70012b] shrink-0">
            {(user.name || user.email)?.[0]?.toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-sm font-medium truncate">{user.name}</span>
            <Badge color={user.role}>{user.role}</Badge>
            <Badge color={user.status}>{user.status}</Badge>
          </div>
          <p className="text-xs text-muted truncate">{user.email}</p>
        </div>
      </div>

      {/* Center: Joined date */}
      <div className="hidden sm:block text-xs text-muted shrink-0">
        Joined {formatDate(user.createdAt, { hour: undefined, minute: undefined })}
      </div>

      {/* Right: Actions */}
      {!isSelf && (
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-[#70012b]/15 bg-[#130007] shadow-xl shadow-black/40 py-1 animate-slide-down">
                {/* Suspend / Reactivate */}
                {user.status === "ACTIVE" ? (
                  <MenuBtn
                    icon={ShieldOff}
                    label="Suspend"
                    danger
                    onClick={() => {
                      setMenuOpen(false);
                      onSuspend(user._id);
                    }}
                  />
                ) : (
                  <MenuBtn
                    icon={ShieldCheck}
                    label="Reactivate"
                    onClick={() => {
                      setMenuOpen(false);
                      onReactivate(user._id);
                    }}
                  />
                )}

                {/* Role change (superadmin only) */}
                {isSuperAdmin && (
                  <>
                    <div className="border-t border-[#70012b]/10 my-1" />
                    {["USER", "ADMIN", "SUPERADMIN"]
                      .filter((r) => r !== user.role)
                      .map((role) => (
                        <MenuBtn
                          key={role}
                          icon={UserCog}
                          label={`Set ${role}`}
                          onClick={() => {
                            setMenuOpen(false);
                            onChangeRole(user._id, role);
                          }}
                        />
                      ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MenuBtn({ icon: Icon, label, danger, onClick }) {
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
