"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { HrVisualFinalizationModel } from "@/modules/department-dashboards/hr/visual/finalization";

export function OrganizationHierarchyCenter({ model }: { model: HrVisualFinalizationModel }) {
  const { t } = useTranslation();

  return (
    <section className="card p-4">
      <h3 className="text-sm font-semibold text-darktext">
        {t("rh.visual.organization.title", "Organization hierarchy center")}
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        {t("rh.visual.organization.subtitle", "Operational health of staffing flows and reporting rhythm.")}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {model.secondaryStats.slice(0, 4).map((s) => (
          <div key={s.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-500">{t(s.label, s.id)}</p>
            <p className="mt-1 text-sm font-semibold text-darktext">{Number(s.value ?? 0)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
