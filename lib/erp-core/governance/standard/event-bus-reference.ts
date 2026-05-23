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
  integration_finance: "lib/erp-core/events/integrations/finance-events.ts",
  handler_notification_crm: "lib/erp-core/events/handlers/notification-crm-bridge.ts",
  handler_notification_approval: "lib/erp-core/events/handlers/notification-approval-bridge.ts",
  handler_notification_finance: "lib/erp-core/events/handlers/notification-finance-bridge.ts",
  automation_engine: "lib/erp-core/events/automation/automation-rule-engine.ts",
  handler_automation_engine: "lib/erp-core/events/handlers/automation-engine-handler.ts",
  delivery_in_app: "lib/erp-core/events/delivery/in-app-notification-service.ts",
  bootstrap_handlers: "lib/erp-core/events/bootstrap/register-default-handlers.ts",
} as const;
