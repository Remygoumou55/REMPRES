"use client";

import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";
import { useTranslation } from "@/hooks/use-translation";
import { HrVisualWidgetShell } from "@/modules/department-dashboards/hr/visual/widgets";

export function HrVisualInsightsPanel({ payload }: { payload: DeptKpiPayload | null }) {
  const { t } = useTranslation();
  const stats = payload?.stats ?? [];
  return (
    <HrVisualWidgetShell
      title={t("rh.visual.panel.title", "Workforce intelligence")}
      subtitle={t("rh.visual.panel.subtitle", "Live HR indicators from department KPI engine")}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {stats.slice(0, 4).map((s) => (
          <div key={s.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-500">{t(s.label, s.id)}</p>
            <p className="mt-1 text-base font-semibold text-darktext">{Number(s.value ?? 0)}</p>
          </div>
        ))}
      </div>
    </HrVisualWidgetShell>
  );
}
