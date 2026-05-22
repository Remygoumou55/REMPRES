/**
 * B2.4 — ORCHESTRATION STANDARD ERP (contrat normatif).
 * Référence : quote→sale (B2.0 contrat, B2.2 RPC).
 */

import { ERP_GOVERNANCE_STANDARD_VERSION } from "@/lib/erp-core/governance/standard/standard-version";

export const ERP_ORCHESTRATION_STANDARD_VERSION = ERP_GOVERNANCE_STANDARD_VERSION;

export type ErpOrchestrationPlan = {
  version: string;
  steps: readonly string[];
  rollbackOnFailure: true;
};

/**
 * Étapes minimales pour orchestration cross-entités avec FK bidirectionnelles.
 */
export const ERP_ORCHESTRATION_REQUIRED_CAPABILITIES = [
  "pre_validate_state",
  "atomic_transaction",
  "bidirectional_fk_consistency_check",
  "post_assert_link_consistency",
  "governance_audit_on_success",
] as const;

export const ERP_ORCHESTRATION_FORBIDDEN_PATTERNS = [
  "multi_update_without_transaction",
  "client_side_only_fk_link",
  "orchestration_in_ui_component",
  "rpc_without_rollback_story",
] as const;

/** Référence Vente. */
export const VENTE_REFERENCE_ORCHESTRATION = {
  contract: "lib/vente/runtime/quote-sale-orchestration.ts",
  rpc: "supabase/sql/051_crm_quote_convert_sale_orchestration.sql",
  version: "b2.0-v1",
} as const;
