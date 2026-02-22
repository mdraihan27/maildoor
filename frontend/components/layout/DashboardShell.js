/**
 * DashboardShell — Layout wrapper for dashboard pages.
 * Provides page header and consistent spacing.
 */

export default function DashboardShell({ title, description, actions, children }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>

      {/* Page body */}
      {children}
    </div>
  );
}
