"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { LogisticsVisualFinalizationModel } from "@/modules/department-dashboards/logistics/visual/finalization";

export function LogisticsForecastPanel({ model }: { model: LogisticsVisualFinalizationModel }) {
  const { t } = useTranslation();
  const base = Number(model.heroStats[0]?.value ?? 0);
  const forecast = Math.round(base * 1.05);

  return (
    <section className="card p-4">
      <h3 className="text-sm font-semibold text-darktext">{t("logistics.visual.forecast.title", "Logistics forecasting")}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">{t("logistics.visual.forecast.current", "Current reference")}</p>
          <p className="mt-1 text-base font-semibold text-darktext">{Math.round(base)}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <p className="text-xs text-emerald-700">{t("logistics.visual.forecast.next", "Forecast projection")}</p>
          <p className="mt-1 text-base font-semibold text-emerald-900">{forecast}</p>
        </div>
      </div>
    </section>
  );
}
