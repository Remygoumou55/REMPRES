import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";

/** Identifiant logique de tableau de bord (slug stable, pas UUID obligatoire en phase 1). */
export type DashboardFoundationId = string;

/** Domaines ERP déjà câblés côté routes / permissions module_key. */
export type DashboardErpDomainKey =
  | "vente"
  | "finance"
  | "rh"
  | "logistique"
  | "formation"
  | "consultation"
  | "marketing"
  | "crm"
  | "dashboard";

/** Couche filtres globaux — étendue sans casser les écrans existants (hydratation progressive). */
export type DashboardGlobalFilterState = {
  tenantId: string | null;
  currencyCode: string | null;
  dateRange: DashboardDateRangePreset | null;
};

export type DashboardDateRangePreset = "7d" | "30d" | "mtd" | "qtd" | "ytd" | "custom";

export type DashboardSnapshotMeta = {
  engineVersion: string;
  correlationId: string;
  generatedAtIso: string;
};

/** Agrégat standardisé pour orchestration multi-sources (réutilise le contrat dept KPI existant). */
export type DashboardFoundationSnapshot = {
  id: DashboardFoundationId;
  domains: Partial<Record<DashboardErpDomainKey, DeptKpiPayload>>;
  meta: DashboardSnapshotMeta;
};

export type DashboardWidgetKind =
  | "kpi_strip"
  | "chart"
  | "table"
  | "activity"
  | "alerts"
  | "ai_insight"
  | "observability_health";

export type DashboardWidgetPlacement = {
  widgetKey: string;
  kind: DashboardWidgetKind;
  colspan?: number;
  rowspan?: number;
};

export type DashboardLayoutBlueprint = {
  foundationId: DashboardFoundationId;
  titleKey: string;
  placements: DashboardWidgetPlacement[];
};
