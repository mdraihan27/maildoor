/**
 * AuditRow — Single audit log entry row.
 */
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export default function AuditRow({ log }) {
  return (
    <div className="rounded-lg border border-[#70012b]/5 bg-[#130007]/15 px-3 sm:px-4 py-3 sm:py-3.5 transition-colors hover:bg-[#130007]/25">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {/* Left: Action + category */}
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <Badge color={log.category}>{log.category}</Badge>
          <span className="text-sm font-medium truncate">
            {formatAction(log.action)}
          </span>
          {log.outcome && (
            <Badge color={log.outcome}>{log.outcome}</Badge>
          )}
        </div>

        {/* Right: Timestamp */}
        <span className="text-xs text-muted whitespace-nowrap">
          {formatDate(log.createdAt)}
        </span>
      </div>

      {/* Details row */}
      <div className="mt-2 flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-1 text-xs text-muted">
        {log.ip && (
          <span>
            <span className="text-muted/50">IP</span> {log.ip}
          </span>
        )}
        {log.resource && (
          <span>
            <span className="text-muted/50">Resource</span> {log.resource}
          </span>
        )}
        {log.deviceInfo && (
          <span>
            <span className="text-muted/50">Device</span> {log.deviceInfo}
          </span>
        )}
        {log.durationMs != null && (
          <span>
            <span className="text-muted/50">Duration</span> {log.durationMs}ms
          </span>
        )}
        {log.errorMessage && (
          <span className="text-red-400">
            <span className="text-red-400/50">Error</span> {log.errorMessage}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Convert audit action to readable text.
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
