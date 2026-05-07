"use client";

import { useTranslation } from "@/hooks/use-translation";
import { GovernanceKpiCard } from "./GovernanceKpiCard";

export function GovernanceSummaryGrid({
  salesToday,
  salesMonth,
  unresolvedAlerts,
  pendingApprovals,
  healthScore,
}: {
  salesToday: number;
  salesMonth: number;
  unresolvedAlerts: number;
  pendingApprovals: number;
  healthScore: number;
}) {
  const { t } = useTranslation();
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <GovernanceKpiCard label={t("governance.analytics.summary.salesToday")} value={String(salesToday)} />
      <GovernanceKpiCard label={t("governance.analytics.summary.salesMonth")} value={String(salesMonth)} />
      <GovernanceKpiCard label={t("governance.analytics.summary.unresolvedAlerts")} value={String(unresolvedAlerts)} />
      <GovernanceKpiCard label={t("governance.analytics.summary.pendingApprovals")} value={String(pendingApprovals)} />
      <GovernanceKpiCard
        label={t("governance.analytics.summary.enterpriseHealth")}
        value={`${healthScore}/100`}
        hint={t("governance.analytics.summary.enterpriseHealthHint")}
      />
    </section>
  );
}
