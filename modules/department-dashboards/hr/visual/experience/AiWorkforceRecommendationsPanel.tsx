"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { HrVisualFinalizationModel } from "@/modules/department-dashboards/hr/visual/finalization";

export function AiWorkforceRecommendationsPanel({ model }: { model: HrVisualFinalizationModel }) {
  const { t } = useTranslation();
  const recommendations = model.alerts.slice(0, 3).map((a, idx) => ({
    id: a.id,
    title: t("rh.visual.ai.recommendationTitle", `Recommendation ${idx + 1}`),
    summary: t(a.message, a.message),
  }));

  return (
    <section className="card p-4">
      <h3 className="text-sm font-semibold text-darktext">
        {t("rh.visual.ai.title", "AI workforce recommendation panel")}
      </h3>
      <div className="mt-3 space-y-2">
        {recommendations.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
            {t("rh.visual.ai.empty", "No recommendation at the moment.")}
          </p>
        ) : (
          recommendations.map((r) => (
            <article key={r.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-xs font-semibold text-darktext">{r.title}</p>
              <p className="mt-1 text-sm text-gray-600">{r.summary}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
