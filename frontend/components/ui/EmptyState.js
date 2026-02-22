/**
 * EmptyState — Shown when a list has no items.
 */
import { cn } from "@/lib/utils";

export default function EmptyState({ icon: Icon, title, description, children, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 rounded-xl bg-[#70012b]/10 p-4">
          <Icon size={32} className="text-[#70012b]" />
        </div>
      )}
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
