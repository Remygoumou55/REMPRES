/**
 * B2.4 — RUNTIME STANDARD ERP (contrat normatif).
 * Implémentation de référence : lib/vente/runtime/* (Vente B2.0→B2.3).
 */

import { ERP_GOVERNANCE_STANDARD_VERSION } from "@/lib/erp-core/governance/standard/standard-version";

export const ERP_RUNTIME_STANDARD_VERSION = ERP_GOVERNANCE_STANDARD_VERSION;

/** Couches runtime obligatoires par département mature. */
export const ERP_RUNTIME_LAYER_IDS = [
  "lifecycle",
  "aggregation",
  "domain_kpi",
  "security",
  "mutation_governance",
  "orchestration_contract",
  "cockpit_payload",
] as const;

export type ErpRuntimeLayerId = (typeof ERP_RUNTIME_LAYER_IDS)[number];

/**
 * Boundaries : un module runtime ne doit pas importer de pages UI ni d'actions serveur métier.
 */
export const ERP_RUNTIME_FORBIDDEN_IMPORTS = [
  "app/(app)",
  "components/cockpit/DepartmentCockpitPlaceholder",
  "modules/*/components",
] as const;

/**
 * SoT : chaque domaine expose UNE fonction d'agrégat KPI versionnée + metadata.source explicite.
 */
export type ErpRuntimeSourceMetadata = {
  source: string;
  generatedAt: string;
};

/**
 * Façade dept supervision : dérivée du domain_kpi, jamais recalcul parallèle avec filtres divergents.
 */
export const ERP_RUNTIME_SUPERVISION_RULE =
  "dept_api_payload_must_derive_from_official_domain_kpi" as const;
