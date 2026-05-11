"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DepartmentOperationsStrip } from "@/modules/department-dashboards/components/DepartmentOperationsStrip";
import {
  ExecutiveFinanceHero,
  FinanceActivityHeatmap,
  FinanceAiInsightsPanel,
  FinanceVisualExportActions,
  ForecastingOverlayPanel,
  ProfitabilityCashflowCenter,
  RevenueExpenseAnalyticsCenter,
  buildFinanceVisualFinalizationModel,
  FinanceMobileStrip,
} from "@/modules/department-dashboards/finance/visual";
import { useFinanceVisualRefresh, useFinanceVisualSnapshot } from "@/modules/department-dashboards/finance/hooks";

export function FinanceVisualPageClient() {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useFinanceVisualSnapshot();
  const refresh = useFinanceVisualRefresh();

  if (isLoading) {
    return (
      <div className="page-wrapper space-y-4">
        <div className="card h-20 animate-pulse" />
        <div className="card h-56 animate-pulse" />
        <div className="card h-72 animate-pulse" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="page-wrapper space-y-4">
        <PageHeader
          title={t("finance.visual.title", "Finance Visual Operations Center")}
          subtitle={t("finance.visual.subtitle", "Executive-grade financial operations and intelligence")}
        />
        <div className="card border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {t("finance.visual.error", "Unable to load finance visual indicators.")}
          {error instanceof Error ? ` (${error.message})` : ""}
        </div>
      </div>
    );
  }

  const model = buildFinanceVisualFinalizationModel(data);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title={t("finance.visual.title", "Finance Visual Operations Center")}
        subtitle={t("finance.visual.subtitle", "Executive-grade financial operations and intelligence")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh.mutate()}
              loading={refresh.isPending}
              loadingText={t("finance.visual.refreshing", "Refreshing...")}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              {t("finance.visual.refresh", "Refresh")}
            </Button>
            <Link href="/finance" className="text-sm font-medium text-primary hover:underline">
              {t("finance.visual.backFinance", "Back to finance")}
            </Link>
          </div>
        }
      />

      <FinanceMobileStrip model={model} />
      <ExecutiveFinanceHero model={model} />
      <DepartmentOperationsStrip deptKey="finance" />
      <RevenueExpenseAnalyticsCenter model={model} />
      <ProfitabilityCashflowCenter model={model} />
      <ForecastingOverlayPanel model={model} />
      <FinanceActivityHeatmap cells={model.heatmap} />
      <FinanceAiInsightsPanel model={model} />
      <FinanceVisualExportActions />
    </div>
  );
}
