/**
 * B3.2 — Référence Event Bus ERP (cartographie slots).
 */

export const ERP_EVENT_BUS_STANDARD_SLOTS = {
  root: "lib/erp-core/events/",
  contracts: "lib/erp-core/events/event-contracts.ts",
  taxonomy: "lib/erp-core/events/event-taxonomy.ts",
  registry: "lib/erp-core/events/event-registry.ts",
  dispatcher: "lib/erp-core/events/event-dispatcher.ts",
  bus: "lib/erp-core/events/event-bus.ts",
  security: "lib/erp-core/events/event-security.ts",
  traceability: "lib/erp-core/events/event-traceability.ts",
  integration_approval: "lib/erp-core/events/integrations/approval-events.ts",
  integration_crm: "lib/erp-core/events/integrations/crm-events.ts",
} as const;
