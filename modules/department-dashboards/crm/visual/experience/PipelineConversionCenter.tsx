"use client";

import { useTranslation } from "@/hooks/use-translation";
import { DashboardChartFromSpec } from "@/modules/dashboard-system/charts";
import type { CrmVisualFinalizationModel } from "@/modules/department-dashboards/crm/visual/finalization";

export function PipelineConversionCenter({ model }: { model: CrmVisualFinalizationModel }) {
  const { t } = useTranslation();
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <article className="card p-4 lg:col-span-2">
        <h3 className="mb-3 text-sm font-semibold text-darktext">
          {t("crm.visual.analytics.pipeline", "Pipeline visualization & conversion analytics")}
        </h3>
        <DashboardChartFromSpec
          chart={model.chart}
          emptyMessage={t("crm.visual.chart.empty", "No CRM series available yet.")}
        />
      </article>
      <article className="card p-4">
        <h3 className="text-sm font-semibold text-darktext">
          {t("crm.visual.analytics.realtime", "Realtime sales activity")}
        </h3>
        <ul className="mt-3 space-y-2">
          {model.activity.slice(0, 6).map((a) => (
            <li key={a.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {t(a.label, a.label)}
            </li>
          ))}
          {model.activity.length === 0 ? (
            <li className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
              {t("crm.visual.analytics.noActivity", "No realtime sales activity.")}
            </li>
          ) : null}
        </ul>
      </article>
    </section>
  );
}
