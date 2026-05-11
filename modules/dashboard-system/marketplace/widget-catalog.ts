import type { DashboardWidgetKind } from "../types/domain";

export type DashboardMarketplaceWidgetDescriptor = {
  key: string;
  kind: DashboardWidgetKind;
  titleKey: string;
  descriptionKey: string;
  domains: readonly string[];
};

/** Catalogue statique phase 1 — les installations runtime suivront le marketplace plateforme. */
export const DASHBOARD_WIDGET_MARKETPLACE_CATALOG: readonly DashboardMarketplaceWidgetDescriptor[] = [
  {
    key: "core.kpi_strip",
    kind: "kpi_strip",
    titleKey: "dashboard.foundation.marketplace.kpiStrip.title",
    descriptionKey: "dashboard.foundation.marketplace.kpiStrip.desc",
    domains: ["vente", "finance", "rh", "logistique"],
  },
  {
    key: "core.timeseries",
    kind: "chart",
    titleKey: "dashboard.foundation.marketplace.timeseries.title",
    descriptionKey: "dashboard.foundation.marketplace.timeseries.desc",
    domains: ["vente", "finance"],
  },
  {
    key: "core.ai_insights",
    kind: "ai_insight",
    titleKey: "dashboard.foundation.marketplace.ai.title",
    descriptionKey: "dashboard.foundation.marketplace.ai.desc",
    domains: ["dashboard"],
  },
];
