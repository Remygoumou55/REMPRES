"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { FinanceVisualFinalizationModel } from "@/modules/department-dashboards/finance/visual/finalization";

export function ForecastingOverlayPanel({ model }: { model: FinanceVisualFinalizationModel }) {
  const { t } = useTranslation();
  const latest = model.heroStats[0]?.value ?? 0;
  const forecast = Math.round(Number(latest) * 1.08);

  return (
    <section className="card p-4">
      <h3 className="text-sm font-semibold text-darktext">{t("finance.visual.forecast.title", "Financial forecasting overlay")}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">{t("finance.visual.forecast.current", "Current reference")}</p>
          <p className="mt-1 text-base font-semibold text-darktext">{Math.round(Number(latest))}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <p className="text-xs text-emerald-700">{t("finance.visual.forecast.next", "Forecast projection")}</p>
          <p className="mt-1 text-base font-semibold text-emerald-900">{forecast}</p>
        </div>
      </div>
    </section>
  );
}
