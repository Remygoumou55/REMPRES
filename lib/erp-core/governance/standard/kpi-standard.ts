/**
 * B2.4 — KPI STANDARD ERP (contrat normatif).
 * Règle : 1 indicateur = 1 SoT = 1 définition de filtre = 1 source versionnée.
 */

import { ERP_GOVERNANCE_STANDARD_VERSION } from "@/lib/erp-core/governance/standard/standard-version";

export const ERP_KPI_STANDARD_VERSION = ERP_GOVERNANCE_STANDARD_VERSION;

/** Préfixe obligatoire des identifiants source KPI : `{dept}-{domain}-runtime-v{n}` */
export const ERP_KPI_SOURCE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*-runtime-v\d+$/;

export type ErpKpiSourceContract = {
  /** Identifiant stable (ex. vente-commerce-runtime-v1). */
  source: string;
  generatedAt: string;
  /** Domaine métier (commerce, crm, finance_treasury, rh_headcount, …). */
  domain: string;
  departmentKey: string;
};

/**
 * Consommation autorisée par surface.
 */
export const ERP_KPI_CONSUMPTION_SURFACES = {
  manager_cockpit: "get{Dept}CockpitPayload",
  dept_supervision_api: "buildDept{Dept}KpiPayload",
  global_sa_dashboard: "getDashboardKpis_or_governance_aggregate",
} as const;

/** Interdictions globales (B1.4 / B2.0 / B2.4). */
export const ERP_KPI_FORBIDDEN_PATTERNS = [
  "inline_sales_sum_in_page_without_lifecycle_filter",
  "duplicate_kpi_query_in_cockpit_and_hub",
  "deleted_at_as_operational_kpi_filter_when_lifecycle_exists",
  "zero_placeholder_presented_as_real_metric",
] as const;

/**
 * Sources KPI Vente verrouillées (référence — ne pas dupliquer).
 */
export const VENTE_REFERENCE_KPI_SOURCES = {
  commerce: "vente-commerce-runtime-v1",
  crm: "crm-operational-runtime-v1",
  bundle: "vente-runtime-kpi-bundle-v1",
  cockpit: "vente-cockpit-runtime-v1",
} as const;
