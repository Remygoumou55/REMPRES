/**
 * B2.4 — Cartographie Vente → slots du standard ERP (référence, pas duplication runtime).
 */

export const VENTE_ERP_STANDARD_SLOTS = {
  runtime_root: "lib/vente/runtime/",
  lifecycle: "lib/vente/runtime/sales-lifecycle.ts",
  aggregation: "lib/vente/runtime/sale-kpi-aggregates.ts",
  domain_kpi_commerce: "lib/vente/runtime/vente-commerce-kpis.ts",
  domain_kpi_facade: "lib/vente/runtime/vente-kpi-runtime.ts",
  security: "lib/vente/runtime/vente-runtime-security.ts",
  mutation_registry: "lib/vente/runtime/crm-write-governance.ts",
  state_machine: "lib/vente/runtime/crm-state-machine.ts",
  orchestration_contract: "lib/vente/runtime/quote-sale-orchestration.ts",
  cockpit_payload: "lib/vente/runtime/vente-cockpit-payload.ts",
  cockpit_ui: "components/dashboard/dept-home-page.tsx",
  cockpit_route: "/dept/vente",
  mutations_impl: "modules/crm/server/services/crm-mutations.ts",
  orchestration_impl: "modules/crm/server/services/quote-sale-conversion.ts",
  audit_hook: "modules/crm/server/services/crm-audit-hook.ts",
} as const;
