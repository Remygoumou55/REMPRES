"use client";

import { Users, UserCheck, ClipboardCheck } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import type { HrVisualFinalizationModel } from "@/modules/department-dashboards/hr/visual/finalization";

const ICONS = [Users, UserCheck, ClipboardCheck, Users];

export function WorkforceHeroSection({ model }: { model: HrVisualFinalizationModel }) {
  const { t } = useTranslation();

  return (
    <section className="card border border-primary/20 bg-gradient-to-r from-primary/5 to-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        {t("rh.visual.hero.kicker", "Workforce operations center")}
      </p>
      <h2 className="mt-1 text-xl font-bold text-darktext">
        {t("rh.visual.hero.title", "Executive-ready HR visual command")}
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        {t("rh.visual.hero.subtitle", "Unified workforce intelligence across employees, recruitment and operations.")}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {model.primaryStats.map((stat, index) => {
          const Icon = ICONS[index % ICONS.length];
          return (
            <article key={stat.id} className="rounded-xl border border-gray-200 bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <p className="text-xs text-gray-500">{t(stat.label, stat.id)}</p>
              </div>
              <p className="mt-1 text-lg font-semibold text-darktext">{Number(stat.value ?? 0)}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
