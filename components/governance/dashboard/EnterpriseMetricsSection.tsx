"use client";

import { useTranslation } from "@/hooks/use-translation";
import { EnterpriseOverviewCard } from "./EnterpriseOverviewCard";

type EnterpriseMetricsSectionProps = {
  clientsTotal: number;
  salesToday: number;
  salesMonth: number;
  netSaleAmountMonth: number;
};

export function EnterpriseMetricsSection({
  clientsTotal,
  salesToday,
  salesMonth,
  netSaleAmountMonth,
}: EnterpriseMetricsSectionProps) {
  const { t, locale } = useTranslation();
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <EnterpriseOverviewCard
        title={t("governance.dashboard.enterpriseMetrics.commercialPerformance")}
        value={String(clientsTotal)}
        subtitle={t("governance.dashboard.enterpriseMetrics.commercialPerformanceHint")}
      />
      <EnterpriseOverviewCard
        title={t("governance.dashboard.enterpriseMetrics.operationalFlow")}
        value={String(salesToday)}
        subtitle={t("governance.dashboard.enterpriseMetrics.operationalFlowHint")}
      />
      <EnterpriseOverviewCard
        title={t("governance.dashboard.enterpriseMetrics.monthlyTransactions")}
        value={String(salesMonth)}
        subtitle={t("governance.dashboard.enterpriseMetrics.monthlyTransactionsHint")}
      />
      <EnterpriseOverviewCard
        title={t("governance.dashboard.enterpriseMetrics.monthlyNet")}
        value={new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US").format(netSaleAmountMonth)}
        subtitle={t("governance.dashboard.enterpriseMetrics.monthlyNetHint")}
      />
    </section>
  );
}
