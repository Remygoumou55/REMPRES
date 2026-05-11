"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { CrmVisualFinalizationModel } from "@/modules/department-dashboards/crm/visual/finalization";

export function AiSalesInsightsPanel({ model }: { model: CrmVisualFinalizationModel }) {
  const { t } = useTranslation();
  const items = model.alerts.slice(0, 3).map((a, i) => ({
    id: a.id,
    title: `${t("crm.visual.ai.recommendation", "Recommendation")} ${i + 1}`,
    summary: t(a.message, a.message),
  }));

  return (
    <section className="card p-4">
      <h3 className="text-sm font-semibold text-darktext">{t("crm.visual.ai.title", "AI sales insights")}</h3>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
            {t("crm.visual.ai.empty", "No recommendation at the moment.")}
          </p>
        ) : (
          items.map((x) => (
            <article key={x.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-xs font-semibold text-darktext">{x.title}</p>
              <p className="mt-1 text-sm text-gray-600">{x.summary}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
