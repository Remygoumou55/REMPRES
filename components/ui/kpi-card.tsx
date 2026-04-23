import type { LucideIcon } from "lucide-react";

type KpiCardProps = {
  label:     string;
  value:     string | number;
  icon:      LucideIcon;
  iconColor: string;  // ex: "text-primary", "text-emerald-600"
  iconBg:    string;  // ex: "bg-primary/10", "bg-emerald-50"
  sub?:      string;
  trend?:    { value: string; up: boolean };
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  sub,
  trend,
}: KpiCardProps) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Icône */}
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon size={20} className={iconColor} />
      </div>

      {/* Contenu */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-darktext">{value}</p>

        <div className="mt-1 flex items-center gap-2">
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                trend.up ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {trend.up ? "↑" : "↓"} {trend.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
