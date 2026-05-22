/**
 * B3 — Cartographie Finance → slots ERP Governance Standard B2.4.
 */

export const FINANCE_ERP_STANDARD_SLOTS = {
  runtime_root: "lib/finance/runtime/",
  transaction_rules: "lib/finance/runtime/finance-transaction-rules.ts",
  domain_kpi_treasury: "lib/finance/runtime/finance-treasury-kpis.ts",
  domain_kpi_enterprise: "lib/finance/runtime/finance-enterprise-kpis.ts",
  domain_kpi_facade: "lib/finance/runtime/finance-kpi-runtime.ts",
  security: "lib/finance/runtime/finance-runtime-security.ts",
  mutation_registry: "lib/finance/runtime/finance-write-governance.ts",
  cockpit_payload: "lib/finance/runtime/finance-cockpit-payload.ts",
  cockpit_ui: "modules/finance/components/cockpit/FinanceCockpitClient.tsx",
  audit_hook: "modules/finance/server/services/finance-audit-hook.ts",
  cfo_data_legacy: "lib/server/finance-overview.ts",
} as const;

export const FINANCE_REFERENCE_KPI_SOURCES = {
  treasury: "finance-treasury-runtime-v1",
  enterprise: "finance-enterprise-runtime-v1",
  bundle: "finance-runtime-kpi-bundle-v1",
  cockpit: "finance-cockpit-runtime-v1",
} as const;
