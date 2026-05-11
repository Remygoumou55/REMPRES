"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { CrmVisualFinalizationModel } from "@/modules/department-dashboards/crm/visual/finalization";

export function SalesMobileStrip({ model }: { model: CrmVisualFinalizationModel }) {
  const { t } = useTranslation();
  return (
    <section className="card p-3 lg:hidden">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {t("crm.visual.mobile.title", "Mobile sales quick view")}
      </h3>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {model.heroStats.map((s) => (
          <article key={s.id} className="min-w-[140px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-[11px] text-gray-500">{t(s.label, s.id)}</p>
            <p className="mt-1 text-base font-semibold text-darktext">{Number(s.value ?? 0)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
