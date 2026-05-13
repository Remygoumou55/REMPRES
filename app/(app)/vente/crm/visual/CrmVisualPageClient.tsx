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
  const { data, isLoading, isError } = useCrmVisualSnapshot();
  const refresh = useCrmVisualRefresh();

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
            title={t("crm.visual.title", "Pilotage visuel vente & CRM")}
            subtitle={t(
              "crm.visual.subtitle",
              "Pipeline, clients, prévisions et activité commerciale consolidés.",
            )}
          />
          <div className="card border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {t("crm.visual.error", "Impossible de charger le pilotage visuel CRM.")}
          </div>
        </div>
      </div>
    );
  }

  const model = buildCrmVisualFinalizationModel(data);

  return (
    <div className="page-wrapper">
      <PageHeader
        title={t("crm.visual.title", "Pilotage visuel vente & CRM")}
        subtitle={t("crm.visual.subtitle", "Pipeline, clients, prévisions et activité commerciale consolidés.")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh.mutate()}
              loading={refresh.isPending}
              loadingText={t("crm.visual.refreshing", "Actualisation…")}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              {t("crm.visual.refresh", "Actualiser")}
            </Button>
            <Link href="/vente/crm" className="text-sm font-medium text-primary hover:underline">
              {t("crm.visual.backCrm", "Retour CRM")}
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
