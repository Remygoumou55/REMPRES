"use client";

import { memo } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { GovernanceActivityFeed } from "./GovernanceActivityFeed";
import type { GlobalGovernanceKpi } from "@/lib/governance/kpi/aggregate-kpi";

type DepartmentActivitySectionProps = {
  recentActivity: GlobalGovernanceKpi["recentActivity"];
};

export function DepartmentActivitySection({ recentActivity }: DepartmentActivitySectionProps) {
  const { t } = useTranslation();
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">{t("governance.dashboard.departmentActivity.title")}</h2>
      <MemoGovernanceActivityFeed events={recentActivity} />
    </section>
  );
}

const MemoGovernanceActivityFeed = memo(GovernanceActivityFeed);
