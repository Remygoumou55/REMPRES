"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DepartmentOperationsStrip } from "@/modules/department-dashboards/components/DepartmentOperationsStrip";
import {
  AiSalesInsightsPanel,
  buildCrmVisualFinalizationModel,
  CrmVisualExportActions,
  CustomerChurnCenter,
  PipelineConversionCenter,
  RevenueForecastPanel,
  SalesActivityHeatmap,
  SalesExecutiveHero,
  SalesMobileStrip,
} from "@/modules/department-dashboards/crm/visual";
import { useCrmVisualRefresh, useCrmVisualSnapshot } from "@/modules/department-dashboards/crm/hooks";

export function CrmVisualPageClient() {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useCrmVisualSnapshot();
  const refresh = useCrmVisualRefresh();

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
          title={t("crm.visual.title", "Sales & Customer Operations Center")}
          subtitle={t("crm.visual.subtitle", "Executive-grade CRM intelligence and sales operations")}
        />
        <div className="card border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {t("crm.visual.error", "Unable to load CRM visual indicators.")}
          {error instanceof Error ? ` (${error.message})` : ""}
        </div>
      </div>
    );
  }

  const model = buildCrmVisualFinalizationModel(data);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title={t("crm.visual.title", "Sales & Customer Operations Center")}
        subtitle={t("crm.visual.subtitle", "Executive-grade CRM intelligence and sales operations")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh.mutate()}
              loading={refresh.isPending}
              loadingText={t("crm.visual.refreshing", "Refreshing...")}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              {t("crm.visual.refresh", "Refresh")}
            </Button>
            <Link href="/vente/crm" className="text-sm font-medium text-primary hover:underline">
              {t("crm.visual.backCrm", "Back to CRM")}
            </Link>
          </div>
        }
      />

      <SalesMobileStrip model={model} />
      <SalesExecutiveHero model={model} />
      <DepartmentOperationsStrip deptKey="vente" />
      <PipelineConversionCenter model={model} />
      <CustomerChurnCenter model={model} />
      <RevenueForecastPanel model={model} />
      <SalesActivityHeatmap cells={model.heatmap} />
      <AiSalesInsightsPanel model={model} />
      <CrmVisualExportActions />
    </div>
  );
}
