"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DepartmentOperationsStrip } from "@/modules/department-dashboards/components/DepartmentOperationsStrip";
import {
  AiLogisticsInsightsPanel,
  buildLogisticsVisualFinalizationModel,
  DeliverySupplierCenter,
  InventoryWarehouseCenter,
  LogisticsActivityHeatmap,
  LogisticsExecutiveHero,
  LogisticsForecastPanel,
  LogisticsMobileStrip,
  LogisticsVisualExportActions,
} from "@/modules/department-dashboards/logistics/visual";
import { useLogisticsVisualRefresh, useLogisticsVisualSnapshot } from "@/modules/department-dashboards/logistics/hooks";

export function LogisticsVisualPageClient() {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useLogisticsVisualSnapshot();
  const refresh = useLogisticsVisualRefresh();

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
          title={t("logistics.visual.title", "Supply Chain Operations Center")}
          subtitle={t("logistics.visual.subtitle", "Executive-grade logistics operations and intelligence")}
        />
        <div className="card border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {t("logistics.visual.error", "Unable to load logistics visual indicators.")}
          {error instanceof Error ? ` (${error.message})` : ""}
        </div>
      </div>
    );
  }

  const model = buildLogisticsVisualFinalizationModel(data);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title={t("logistics.visual.title", "Supply Chain Operations Center")}
        subtitle={t("logistics.visual.subtitle", "Executive-grade logistics operations and intelligence")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh.mutate()}
              loading={refresh.isPending}
              loadingText={t("logistics.visual.refreshing", "Refreshing...")}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              {t("logistics.visual.refresh", "Refresh")}
            </Button>
            <Link href="/logistique" className="text-sm font-medium text-primary hover:underline">
              {t("logistics.visual.backLogistics", "Back to logistics")}
            </Link>
          </div>
        }
      />

      <LogisticsMobileStrip model={model} />
      <LogisticsExecutiveHero model={model} />
      <DepartmentOperationsStrip deptKey="logistique" />
      <InventoryWarehouseCenter model={model} />
      <DeliverySupplierCenter model={model} />
      <LogisticsForecastPanel model={model} />
      <LogisticsActivityHeatmap cells={model.heatmap} />
      <AiLogisticsInsightsPanel model={model} />
      <LogisticsVisualExportActions />
    </div>
  );
}
