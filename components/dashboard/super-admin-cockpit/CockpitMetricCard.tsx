import type { LucideIcon } from "lucide-react";

type CockpitMetricColor = "blue" | "green" | "orange" | "red" | "purple";

type CockpitMetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; up: boolean };
  color?: CockpitMetricColor;
  sparkline?: number[];
};

const COLOR_STYLES: Record<
  CockpitMetricColor,
  { border: string; iconBg: string; iconText: string; trendUp: string; trendDown: string; spark: string }
> = {
  blue: {
    border: "border-l-blue-500",
    iconBg: "bg-blue-50",
    iconText: "text-blue-600",
    trendUp: "bg-emerald-50 text-emerald-700",
    trendDown: "bg-red-50 text-red-700",
    spark: "bg-blue-500/70",
  },
  green: {
    border: "border-l-emerald-500",
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
    trendUp: "bg-emerald-50 text-emerald-700",
    trendDown: "bg-red-50 text-red-700",
    spark: "bg-emerald-500/70",
  },
  orange: {
    border: "border-l-orange-500",
    iconBg: "bg-orange-50",
    iconText: "text-orange-600",
    trendUp: "bg-emerald-50 text-emerald-700",
    trendDown: "bg-red-50 text-red-700",
    spark: "bg-orange-500/70",
  },
  red: {
    border: "border-l-red-500",
    iconBg: "bg-red-50",
    iconText: "text-red-600",
    trendUp: "bg-emerald-50 text-emerald-700",
    trendDown: "bg-red-50 text-red-700",
    spark: "bg-red-500/70",
  },
  purple: {
    border: "border-l-purple-500",
    iconBg: "bg-purple-50",
    iconText: "text-purple-600",
    trendUp: "bg-emerald-50 text-emerald-700",
    trendDown: "bg-red-50 text-red-700",
    spark: "bg-purple-500/70",
  },
};

export function CockpitMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "blue",
  sparkline,
}: CockpitMetricCardProps) {
  const styles = COLOR_STYLES[color];
  return (
    <article className={`card border-l-4 ${styles.border} flex flex-col p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{title}</p>
          <p className="mt-1.5 truncate text-2xl font-bold tabular-nums text-darktext sm:text-3xl">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-gray-500 sm:text-sm">{subtitle}</p> : null}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 ${styles.iconBg}`}>
          <Icon size={18} className={styles.iconText} />
        </div>
      </div>
      {sparkline && sparkline.length > 1 ? (
        <div className="mt-3 flex h-8 items-end gap-px rounded-lg bg-gray-50 px-1.5 py-1">
          {sparkline.map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm ${styles.spark}`}
              style={{ height: `${Math.round(h * 100)}%`, minHeight: "3px" }}
            />
          ))}
        </div>
      ) : null}
      {trend ? (
        <div className="mt-2">
          <span
            className={`inline-flex rounded-badge px-2 py-0.5 text-[11px] font-medium ${
              trend.up ? styles.trendUp : styles.trendDown
            }`}
          >
            {trend.up ? "↑" : "↓"} {trend.value}
          </span>
        </div>
      ) : null}
    </article>
  );
}
