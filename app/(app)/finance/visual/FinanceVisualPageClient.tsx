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
  const { data, isLoading, isError } = useFinanceVisualSnapshot();
  const refresh = useFinanceVisualRefresh();

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="space-y-4">
          <div className="card h-20 animate-pulse" />
          <div className="card h-56 animate-pulse" />
          <div className="card h-72 animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="page-wrapper">
        <div className="space-y-4">
          <PageHeader
            title={t("finance.visual.title", "Pilotage visuel Finance")}
            subtitle={t(
              "finance.visual.subtitle",
              "Indicateurs financiers consolidés, trésorerie et tendances pour la direction.",
            )}
          />
          <div className="card border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {t("finance.visual.error", "Impossible de charger le pilotage visuel finance.")}
          </div>
        </div>
      </div>
    );
  }

  const model = buildFinanceVisualFinalizationModel(data);

  return (
    <div className="page-wrapper">
      <PageHeader
        title={t("finance.visual.title", "Pilotage visuel Finance")}
        subtitle={t(
          "finance.visual.subtitle",
          "Indicateurs financiers consolidés, trésorerie et tendances pour la direction.",
        )}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh.mutate()}
              loading={refresh.isPending}
              loadingText={t("finance.visual.refreshing", "Actualisation…")}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              {t("finance.visual.refresh", "Actualiser")}
            </Button>
            <Link href="/finance" className="text-sm font-medium text-primary hover:underline">
              {t("finance.visual.backFinance", "Retour Finance")}
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
