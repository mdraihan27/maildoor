/**
 * StatsCard — Dashboard metric card.
 */
export default function StatsCard({ icon: Icon, label, value, subtitle }) {
  return (
    <div className="rounded-xl border border-[#70012b]/10 bg-[#130007]/20 p-5 transition-colors hover:bg-[#130007]/30">
      <div className="flex items-center gap-3 mb-3">
        {Icon && (
          <div className="rounded-lg bg-[#70012b]/10 p-2">
            <Icon size={18} className="text-[#70012b]" />
          </div>
        )}
        <span className="text-xs text-muted uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-muted">{subtitle}</p>
      )}
    </div>
  );
}
