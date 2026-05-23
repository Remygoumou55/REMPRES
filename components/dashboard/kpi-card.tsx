"use client";

import type { LucideIcon } from "lucide-react";

export type KpiCardColor = "blue" | "green" | "orange" | "purple" | "pink" | "teal" | "red";

const COLOR_MAP: Record<
  KpiCardColor,
  { border: string; iconBg: string; iconColor: string }
> = {
  blue: { border: "#2D7CC4", iconBg: "#EFF6FF", iconColor: "#2D7CC4" },
  green: { border: "#10B981", iconBg: "#ECFDF5", iconColor: "#10B981" },
  orange: { border: "#F59E0B", iconBg: "#FFFBEB", iconColor: "#F59E0B" },
  purple: { border: "#8B5CF6", iconBg: "#F5F3FF", iconColor: "#8B5CF6" },
  pink: { border: "#EC4899", iconBg: "#FDF2F8", iconColor: "#EC4899" },
  teal: { border: "#0F6E56", iconBg: "#E1F5EE", iconColor: "#0F6E56" },
  red: { border: "#EF4444", iconBg: "#FEF2F2", iconColor: "#EF4444" },
};

export type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: KpiCardColor;
  trend?: { label: string; direction: "up" | "down" | "neutral" };
  isEmpty?: boolean;
};

export function KpiCard({ title, value, subtitle, icon: Icon, color, trend, isEmpty }: KpiCardProps) {
  const palette = COLOR_MAP[color];
  const displayValue = isEmpty ? "—" : value;
  const displaySubtitle = isEmpty ? "Module en cours d'activation" : subtitle;

  const trendColor =
    trend?.direction === "up"
      ? "text-emerald-600"
      : trend?.direction === "down"
        ? "text-red-500"
        : "text-gray-500";
  const trendPrefix =
    trend?.direction === "up" ? "↑ " : trend?.direction === "down" ? "↓ " : "";

  return (
    <article
      className="rounded-2xl border-l-[3px] bg-white p-4 shadow-sm"
      style={{ borderLeftColor: palette.border }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: palette.iconBg }}
        >
          <Icon size={18} style={{ color: palette.iconColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.08em]"
            style={{ color: "var(--muted-foreground, #6b7280)" }}
          >
            {title}
          </p>
          <p
            className={`mt-1 text-[22px] font-medium ${isEmpty ? "text-gray-400" : "text-gray-900"}`}
          >
            {displayValue}
          </p>
          {displaySubtitle ? (
            <p
              className={`mt-0.5 text-xs ${isEmpty ? "italic text-gray-400" : "text-gray-500"}`}
            >
              {displaySubtitle}
            </p>
          ) : null}
          {trend && !isEmpty ? (
            <p className={`mt-1 text-xs ${trendColor}`}>
              {trendPrefix}
              {trend.label}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
