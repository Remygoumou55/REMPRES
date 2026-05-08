import type { LucideIcon } from "lucide-react";

type StatsCardColor = "blue" | "green" | "orange" | "red" | "purple";

type StatsCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; up: boolean };
  color?: StatsCardColor;
};

const COLOR_STYLES: Record<
  StatsCardColor,
  { border: string; iconBg: string; iconText: string; trendUp: string; trendDown: string }
> = {
  blue: {
    border: "border-l-blue-500",
    iconBg: "bg-blue-50",
    iconText: "text-blue-600",
    trendUp: "bg-emerald-50 text-emerald-700",
    trendDown: "bg-red-50 text-red-700",
  },
  green: {
    border: "border-l-emerald-500",
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
    trendUp: "bg-emerald-50 text-emerald-700",
    trendDown: "bg-red-50 text-red-700",
  },
  orange: {
    border: "border-l-orange-500",
    iconBg: "bg-orange-50",
    iconText: "text-orange-600",
    trendUp: "bg-emerald-50 text-emerald-700",
    trendDown: "bg-red-50 text-red-700",
  },
  red: {
    border: "border-l-red-500",
    iconBg: "bg-red-50",
    iconText: "text-red-600",
    trendUp: "bg-emerald-50 text-emerald-700",
    trendDown: "bg-red-50 text-red-700",
  },
  purple: {
    border: "border-l-purple-500",
    iconBg: "bg-purple-50",
    iconText: "text-purple-600",
    trendUp: "bg-emerald-50 text-emerald-700",
    trendDown: "bg-red-50 text-red-700",
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "blue",
}: StatsCardProps) {
  const styles = COLOR_STYLES[color];
  return (
    <article
      className={`card border-l-4 ${styles.border} p-5`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-darktext tabular-nums">{value}</p>
          {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${styles.iconBg}`}>
          <Icon size={20} className={styles.iconText} />
        </div>
      </div>
      {trend ? (
        <div className="mt-3">
          <span
            className={`inline-flex rounded-badge px-2.5 py-1 text-xs font-medium ${
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

