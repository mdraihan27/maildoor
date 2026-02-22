/**
 * RecentActivity — Shows recent audit log entries in the dashboard.
 */
import { formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

export default function RecentActivity({ logs = [] }) {
  if (!logs.length) {
    return (
      <p className="text-sm text-muted py-8 text-center">
        No recent activity to show.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div
          key={log._id}
          className="flex items-center justify-between gap-4 rounded-lg border border-[#70012b]/5 bg-[#130007]/15 px-4 py-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Badge color={log.category}>{log.category}</Badge>
            <span className="text-sm text-foreground truncate">
              {formatAction(log.action)}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {log.outcome && (
              <Badge color={log.outcome}>{log.outcome}</Badge>
            )}
            <span className="text-xs text-muted whitespace-nowrap">
              {formatDate(log.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Convert action enum to human-readable text.
 * e.g. "AUTH_GOOGLE_LOGIN" → "Google Login"
 */
function formatAction(action) {
  if (!action) return "—";
  return action
    .replace(/^(AUTH|APIKEY|EMAIL|USER)_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}
