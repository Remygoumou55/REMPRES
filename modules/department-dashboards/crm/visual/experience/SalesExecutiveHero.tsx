"use client";

import { BarChart3, Users, TrendingUp } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import type { CrmVisualFinalizationModel } from "@/modules/department-dashboards/crm/visual/finalization";

const ICONS = [BarChart3, Users, TrendingUp, BarChart3];

export function SalesExecutiveHero({ model }: { model: CrmVisualFinalizationModel }) {
  const { t } = useTranslation();
  return (
    <section className="card border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
        {t("crm.visual.hero.kicker", "Sales operations command center")}
      </p>
      <h2 className="mt-1 text-xl font-bold text-darktext">
        {t("crm.visual.hero.title", "Customer and pipeline intelligence")}
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        {t("crm.visual.hero.subtitle", "Pipeline, conversions, churn and recommendations in one sales cockpit.")}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {model.heroStats.map((s, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <article key={s.id} className="rounded-xl border border-gray-200 bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-indigo-700" />
                <p className="text-xs text-gray-500">{t(s.label, s.id)}</p>
              </div>
              <p className="mt-1 text-lg font-semibold text-darktext">{Number(s.value ?? 0)}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
