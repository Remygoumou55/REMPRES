"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { DepartmentKpi } from "@/lib/governance/kpi/aggregate-kpi";
import { ExecutiveMetricGrid } from "@/components/executive/ExecutiveMetricGrid";
import { EXEC_CARD, EXEC_CARD_PAD } from "@/components/executive/tokens";

type DepartmentKpiCardProps = {
  department: DepartmentKpi;
};

const HEALTH_STYLES: Record<DepartmentKpi["health"], string> = {
  healthy: "bg-emerald-50 text-emerald-700",
  watch: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-700",
};

export function DepartmentKpiCard({ department }: DepartmentKpiCardProps) {
  const { t } = useTranslation();
  return (
    <article className={`${EXEC_CARD} ${EXEC_CARD_PAD}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="min-w-0 text-sm font-semibold text-gray-900 truncate">
          {department.departmentLabel}
        </h3>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${HEALTH_STYLES[department.health]}`}
        >
          {t(`status.${department.health}`)}
        </span>
      </div>
      <div className="mt-4">
        <ExecutiveMetricGrid
          items={[
            { label: t("common.users"), value: department.usersCount },
            { label: t("common.managers"), value: department.managersCount },
            { label: t("common.activity7d"), value: department.activityCount7d },
          ]}
          columns={3}
        />
      </div>
    </article>
  );
}
