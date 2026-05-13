"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DepartmentOperationsStrip } from "@/modules/department-dashboards/components/DepartmentOperationsStrip";
import { HrVisualInsightsPanel } from "@/modules/department-dashboards/hr/components";
import { useHrVisualRefresh, useHrVisualSnapshot } from "@/modules/department-dashboards/hr/hooks";
import {
  AiWorkforceRecommendationsPanel,
  buildHrVisualFinalizationModel,
  HrVisualExportActions,
  OrganizationHierarchyCenter,
  WorkforceActivityHeatmap,
  WorkforceAnalyticsCenter,
  WorkforceHeroSection,
  WorkforceMobileStrip,
} from "@/modules/department-dashboards/hr/visual";

export function RhVisualPageClient() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useHrVisualSnapshot();
  const refresh = useHrVisualRefresh();

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="space-y-4">
          <div className="card h-20 animate-pulse" />
          <div className="card h-48 animate-pulse" />
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
            title={t("rh.visual.title", "Pilotage visuel RH")}
            subtitle={t(
              "rh.visual.subtitle",
              "Indicateurs consolidés, tendances et organisation pour le pilotage des équipes.",
            )}
          />
          <div className="card border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {t("rh.visual.error", "Impossible de charger les indicateurs RH visuels.")}
          </div>
        </div>
      </div>
    );
  }

  const model = buildHrVisualFinalizationModel(data.payload);

  return (
    <div className="page-wrapper">
      <PageHeader
        title={t("rh.visual.title", "Pilotage visuel RH")}
        subtitle={t(
          "rh.visual.subtitle",
          "Indicateurs consolidés, tendances et organisation pour le pilotage des équipes.",
        )}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh.mutate()}
              loading={refresh.isPending}
              loadingText={t("rh.visual.refreshing", "Actualisation...")}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              {t("rh.visual.refresh", "Actualiser")}
            </Button>
            <Link href="/rh" className="text-sm font-medium text-primary hover:underline">
              {t("rh.visual.backRh", "Retour RH")}
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-gray-100 bg-white px-4 py-3 text-xs text-gray-600">
        <span>
          {t("rh.visual.generatedAt", "Dernière mise à jour")} : {data.generatedAtIso}
        </span>
      </div>

      <WorkforceMobileStrip model={model} />
      <WorkforceHeroSection model={model} />
      <DepartmentOperationsStrip deptKey="rh" />
      <HrVisualInsightsPanel payload={data.payload} />
      <WorkforceAnalyticsCenter model={model} />
      <WorkforceActivityHeatmap cells={model.heatmap} />
      <div className="grid gap-4 lg:grid-cols-2">
        <OrganizationHierarchyCenter model={model} />
        <AiWorkforceRecommendationsPanel model={model} />
      </div>
      <HrVisualExportActions />
    </div>
  );
}
