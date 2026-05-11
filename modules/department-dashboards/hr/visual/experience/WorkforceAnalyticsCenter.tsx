"use client";

import { useTranslation } from "@/hooks/use-translation";
import { RhVisualPrimaryChart } from "@/modules/department-dashboards/hr/visual/charts";
import type { HrVisualFinalizationModel } from "@/modules/department-dashboards/hr/visual/finalization";

export function WorkforceAnalyticsCenter({ model }: { model: HrVisualFinalizationModel }) {
  const { t } = useTranslation();

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <article className="card p-4 lg:col-span-2">
        <h3 className="mb-3 text-sm font-semibold text-darktext">
          {t("rh.visual.analytics.trends", "Workforce analytics center")}
        </h3>
        <RhVisualPrimaryChart
          chart={model.chart}
          emptyMessage={t("rh.visual.chart.empty", "No series available yet.")}
        />
      </article>
      <article className="card p-4">
        <h3 className="text-sm font-semibold text-darktext">
          {t("rh.visual.analytics.alerts", "Operational alerts")}
        </h3>
        <ul className="mt-3 space-y-2">
          {model.alerts.slice(0, 5).map((a) => (
            <li key={a.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              {t(a.message, a.message)}
            </li>
          ))}
          {model.alerts.length === 0 ? (
            <li className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
              {t("rh.visual.analytics.noAlerts", "No active alerts.")}
            </li>
          ) : null}
        </ul>
      </article>
    </section>
  );
}
