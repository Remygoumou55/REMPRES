"use client";

import { memo, useMemo } from "react";
import { useTranslation } from "@/hooks/use-translation";
import type { TrendPoint } from "@/lib/governance/analytics/aggregators/trend-analysis";
import { statusTranslationKey, trendTranslationKey } from "@/lib/i18n/statuses";

export const EnterpriseTrendChart = memo(function EnterpriseTrendChart({
  points,
  growthTrend,
  incidentTrend,
  approvalBottleneck,
}: {
  points: TrendPoint[];
  growthTrend: "up" | "down" | "stable";
  incidentTrend: "up" | "down" | "stable";
  approvalBottleneck: "healthy" | "watch" | "critical";
}) {
  const { t } = useTranslation();
  const maxValue = useMemo(
    () => Math.max(1, ...points.map((p) => p.value)),
    [points],
  );

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{t("governance.analytics.trend.title")}</h2>
      <p className="mt-1 text-sm text-gray-600">
        {t("governance.analytics.trend.growth")}: {t(trendTranslationKey(growthTrend))} ·{" "}
        {t("governance.analytics.trend.incidents")}: {t(trendTranslationKey(incidentTrend))} ·{" "}
        {t("governance.analytics.trend.approvalBottleneck")}: {t(statusTranslationKey(approvalBottleneck))}
      </p>
      <div className="mt-4 space-y-2">
        {points.map((point) => (
          <div key={point.labelKey}>
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
              <span>{t(point.labelKey)}</span>
              <span>{point.value}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${Math.round((point.value / maxValue) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});
