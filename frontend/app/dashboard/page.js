/**
 * Dashboard Page — Main overview with stats, profile, and recent activity.
 */
"use client";

import { useEffect, useState } from "react";
import { Key, Shield, Activity } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiKeys as apiKeysApi, audit as auditApi } from "@/lib/api";
import DashboardShell from "@/components/layout/DashboardShell";
import StatsCard from "@/components/dashboard/StatsCard";
import ProfileCard from "@/components/dashboard/ProfileCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import Spinner from "@/components/ui/Spinner";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [keysRes, logsRes] = await Promise.all([
          apiKeysApi.list({ limit: 1 }),
          auditApi.me({ limit: 5 }),
        ]);

        setStats({
          totalKeys: keysRes.meta?.total ?? 0,
          totalLogs: logsRes.meta?.total ?? 0,
        });
        setRecentLogs(logsRes.data || []);
      } catch {
        // Silently handle — data will just be empty
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <DashboardShell
      title={`Welcome back, ${user?.name?.split(" ")[0] || "there"}`}
      description="Here's an overview of your MailDoor account."
    >
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatsCard
          icon={Key}
          label="API Keys"
          value={stats?.totalKeys ?? 0}
          subtitle="Active keys in your account"
        />
        <StatsCard
          icon={Shield}
          label="Audit Events"
          value={stats?.totalLogs ?? 0}
          subtitle="Last 90 days"
        />
        <StatsCard
          icon={Activity}
          label="Role"
          value={user?.role || "USER"}
          subtitle="Current permission level"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile (1/3 width) */}
        <div>
          <ProfileCard user={user} />
        </div>

        {/* Recent activity (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-[#70012b]/10 bg-[#130007]/20 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
              Recent Activity
            </h2>
            <RecentActivity logs={recentLogs} />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
