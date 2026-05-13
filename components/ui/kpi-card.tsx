import type { LucideIcon } from "lucide-react";

type KpiCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  sub?: string;
  trend?: { value: string; up: boolean };
};

const BORDER_BY_ICON_BG: Record<string, string> = {
  "bg-rose-50": "border-l-rose-500",
  "bg-amber-50": "border-l-amber-500",
  "bg-sky-50": "border-l-sky-500",
  "bg-emerald-50": "border-l-emerald-500",
  "bg-primary/10": "border-l-primary",
};

export function KpiCard({ label, value, icon: Icon, iconColor, iconBg, sub, trend }: KpiCardProps) {
  const borderAccent = BORDER_BY_ICON_BG[iconBg] ?? "border-l-primary/50";

  return (
    <article className={`card border-l-4 ${borderAccent} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-darktext">{value}</p>
          {sub ? <p className="mt-1 text-sm text-gray-500">{sub}</p> : null}
          {trend ? (
            <div className="mt-3">
              <span
                className={`inline-flex rounded-badge px-2.5 py-1 text-xs font-medium ${
                  trend.up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}
              >
                {trend.up ? "↑" : "↓"} {trend.value}
              </span>
            </div>
          ) : null}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </article>
  );
}
