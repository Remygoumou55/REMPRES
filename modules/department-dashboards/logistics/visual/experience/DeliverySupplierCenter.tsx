"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { LogisticsVisualFinalizationModel } from "@/modules/department-dashboards/logistics/visual/finalization";

export function DeliverySupplierCenter({ model }: { model: LogisticsVisualFinalizationModel }) {
  const { t } = useTranslation();
  return (
    <section className="card p-4">
      <h3 className="text-sm font-semibold text-darktext">
        {t("logistics.visual.delivery.title", "Delivery monitoring & supplier intelligence")}
      </h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {model.scorecards.slice(0, 8).map((s) => (
          <div key={s.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-500">{t(s.label, s.id)}</p>
            <p className="mt-1 text-sm font-semibold text-darktext">{Number(s.value ?? 0)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
