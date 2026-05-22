/**
 * B2.4 — SECURITY STANDARD ERP (contrat normatif, aligné M2).
 */

import { ERP_GOVERNANCE_STANDARD_VERSION } from "@/lib/erp-core/governance/standard/standard-version";

export const ERP_SECURITY_STANDARD_VERSION = ERP_GOVERNANCE_STANDARD_VERSION;

/** Identité non négociable (profiles). */
export const ERP_SECURITY_IDENTITY_KEYS = ["role_key", "department_key"] as const;

export type ErpSecurityAccessMode = "operational" | "supervision" | "cross_dept_read";

/**
 * Couches de sécurité ERP (ordre d'évaluation).
 */
export const ERP_SECURITY_LAYERS = [
  "session_auth",
  "role_key_permissions_table",
  "department_key_scope",
  "module_permissions",
  "operational_mutation_guard",
  "domain_runtime_assert",
  "sql_rls",
] as const;

/** Règles lecture opérationnelle. */
export const ERP_SECURITY_READ_RULES = {
  operational_requires_department_match: true,
  supervision_allows_cross_dept_read: true,
  module_permission_required_unless_supervision: true,
} as const;

/** Règles écriture opérationnelle. */
export const ERP_SECURITY_WRITE_RULES = {
  super_admin_operational_blocked: true,
  administration_supervision_only_blocked: true,
  supervision_cannot_mutate_operational_data: true,
  department_key_required_for_operational_write: true,
} as const;

/** SEC-1 Vente : couche applicative en attendant alignement SQL dept-aware. */
export const ERP_SECURITY_KNOWN_DEBT = {
  sec1_sql_crm_without_department_key: "049_user_has_crm_module_permission",
  sec1_app_layer_vente_only: "lib/vente/runtime/vente-runtime-security.ts",
} as const;
