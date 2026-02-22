/**
 * ProfileCard — Shows the current user's profile info.
 */
"use client";

import Image from "next/image";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export default function ProfileCard({ user }) {
  if (!user) return null;

  return (
    <div className="rounded-xl border border-[#70012b]/10 bg-[#130007]/20 p-6">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        {user.profilePicture ? (
          <Image
            src={user.profilePicture}
            alt={user.name || "User avatar"}
            width={48}
            height={48}
            className="rounded-full border border-[#70012b]/20"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-[#70012b]/20 flex items-center justify-center text-lg font-semibold text-[#70012b]">
            {(user.name || user.email)?.[0]?.toUpperCase()}
          </div>
        )}

        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold truncate">{user.name}</h3>
            <Badge color={user.role}>{user.role}</Badge>
          </div>
          <p className="text-sm text-muted truncate">{user.email}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-4 pt-4 border-t border-[#70012b]/10 grid grid-cols-2 gap-4 text-xs text-muted">
        <div>
          <span className="uppercase tracking-wider font-medium block mb-0.5">
            Status
          </span>
          <Badge color={user.status}>{user.status}</Badge>
        </div>
        <div>
          <span className="uppercase tracking-wider font-medium block mb-0.5">
            Member since
          </span>
          <span className="text-foreground">
            {formatDate(user.createdAt, {
              hour: undefined,
              minute: undefined,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
