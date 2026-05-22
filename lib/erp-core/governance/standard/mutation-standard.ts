/**
 * B2.4 — MUTATION STANDARD ERP (contrat normatif).
 * Modèle généralisé depuis CRM_WRITE_ACTION_REGISTRY (Vente B2.0/B2.1).
 */

import { ERP_GOVERNANCE_STANDARD_VERSION } from "@/lib/erp-core/governance/standard/standard-version";

export const ERP_MUTATION_STANDARD_VERSION = ERP_GOVERNANCE_STANDARD_VERSION;

/** Format action : `{domain}.{entity}.{verb}` */
export const ERP_MUTATION_ACTION_ID_PATTERN = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

export type ErpMutationRegistryEntry = {
  enabled: boolean;
  requiresApproval: boolean;
  description: string;
};

export type ErpMutationGateResult = {
  action: string;
  userId: string;
  allowed: boolean;
  requiresApproval: boolean;
};

/**
 * Pipeline mutation obligatoire (ordre).
 */
export const ERP_MUTATION_PIPELINE = [
  "assert_operational_mutation_allowed",
  "assert_domain_runtime_write_access",
  "assert_mutation_action_allowed_in_registry",
  "execute_domain_mutation_service",
  "record_governance_audit",
  "revalidate_scopes",
] as const;

export const ERP_MUTATION_FORBIDDEN_PATTERNS = [
  "direct_supabase_insert_from_page_without_gate",
  "server_action_without_registry_check",
  "mutation_without_audit_on_sensitive_domain",
  "requires_approval_flag_without_enforcement",
] as const;

/** Référence Vente : registre CRM (à généraliser par domaine au prochain dept). */
export const VENTE_REFERENCE_MUTATION_REGISTRY_PATH =
  "lib/vente/runtime/crm-write-governance.ts" as const;
