"use client";

import { useTranslation } from "@/hooks/use-translation";
import { DashboardChartFromSpec } from "@/modules/dashboard-system/charts";
import type { LogisticsVisualFinalizationModel } from "@/modules/department-dashboards/logistics/visual/finalization";

export function InventoryWarehouseCenter({ model }: { model: LogisticsVisualFinalizationModel }) {
  const { t } = useTranslation();
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <article className="card p-4 lg:col-span-2">
        <h3 className="mb-3 text-sm font-semibold text-darktext">
          {t("logistics.visual.analytics.inventory", "Inventory analytics & warehouse monitoring")}
        </h3>
        <DashboardChartFromSpec
          chart={model.chart}
          emptyMessage={t("logistics.visual.chart.empty", "No logistics series available yet.")}
        />
      </article>
      <article className="card p-4">
        <h3 className="text-sm font-semibold text-darktext">
          {t("logistics.visual.analytics.alerts", "Stock anomaly detection")}
        </h3>
        <ul className="mt-3 space-y-2">
          {model.alerts.slice(0, 5).map((a) => (
            <li key={a.id} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {t(a.message, a.message)}
            </li>
          ))}
          {model.alerts.length === 0 ? (
            <li className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
              {t("logistics.visual.analytics.noAlerts", "No stock anomaly detected.")}
            </li>
          ) : null}
        </ul>
      </article>
    </section>
  );
}
