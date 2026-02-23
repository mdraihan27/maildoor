/**
 * Audit Logs Page — View personal or all (admin) audit events.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { Shield } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { audit as auditApi } from "@/lib/api";
import DashboardShell from "@/components/layout/DashboardShell";
import AuditRow from "@/components/audit/AuditRow";
import Spinner from "@/components/ui/Spinner";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";

export default function AuditPage() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  /** Fetch audit logs */
  const fetchLogs = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const params = { page: p, limit: 15 };

        /* Admin sees all logs; regular user sees own */
        const res = isAdmin
          ? await auditApi.list(params)
          : await auditApi.me(params);

        setLogs(res.data || []);
        setMeta(res.meta || {});
        setPage(p);
      } catch {
        toast.error("Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    },
    [isAdmin]
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  return (
    <DashboardShell
      title="Audit Logs"
      description={
        isAdmin
          ? "View all system audit events across users."
          : "View your personal audit trail."
      }
    >
      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={24} />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No audit events"
          description="No audit events found."
        />
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <AuditRow key={log._id} log={log} />
          ))}

          <Pagination
            page={page}
            totalPages={meta.totalPages}
            onPageChange={(p) => fetchLogs(p)}
          />
        </div>
      )}
    </DashboardShell>
  );
}
