"use client";

import { Landmark, TrendingUp, Wallet } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import type { FinanceVisualFinalizationModel } from "@/modules/department-dashboards/finance/visual/finalization";

const ICONS = [Landmark, TrendingUp, Wallet, Landmark];

export function ExecutiveFinanceHero({ model }: { model: FinanceVisualFinalizationModel }) {
  const { t } = useTranslation();
  return (
    <section className="card border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
        {t("finance.visual.hero.kicker", "Financial operations command center")}
      </p>
      <h2 className="mt-1 text-xl font-bold text-darktext">
        {t("finance.visual.hero.title", "Executive finance intelligence")}
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        {t("finance.visual.hero.subtitle", "Revenue, expenses, profitability and forecasting in one operational cockpit.")}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {model.heroStats.map((s, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <article key={s.id} className="rounded-xl border border-gray-200 bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-emerald-700" />
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
