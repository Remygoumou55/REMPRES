/**
 * B3.2 — ERP Event Bus (export officiel).
 */

export * from "@/lib/erp-core/events/version";
export * from "@/lib/erp-core/events/event-contracts";
export * from "@/lib/erp-core/events/event-taxonomy";
export * from "@/lib/erp-core/events/event-security";
export * from "@/lib/erp-core/events/event-traceability";
export * from "@/lib/erp-core/events/event-registry";
export * from "@/lib/erp-core/events/event-dispatcher";
export * from "@/lib/erp-core/events/event-bus";
export * from "@/lib/erp-core/events/integrations/approval-events";
export * from "@/lib/erp-core/events/integrations/integration-publish";
export * from "@/lib/erp-core/events/integrations/crm-events";
export * from "@/lib/erp-core/events/governance/event-catalog-governance";
export * from "@/lib/erp-core/events/governance/handler-governance-standard";
export * from "@/lib/erp-core/events/foundation/notification-foundation";
export * from "@/lib/erp-core/events/foundation/automation-foundation";
export * from "@/lib/erp-core/events/foundation/crm-event-migration-plan";
export * from "@/lib/erp-core/events/foundation/finance-event-readiness";
export * from "@/lib/erp-core/events/foundation/crm-legacy-coexistence";
export * from "@/lib/erp-core/events/foundation/crm-mutation-integration-plan";
export * from "@/lib/erp-core/events/governance/crm-publisher-design-map";
export * from "@/lib/erp-core/events/handlers/notification-bridge-log";
export * from "@/lib/erp-core/events/handlers/notification-crm-bridge";
export * from "@/lib/erp-core/events/handlers/notification-approval-bridge";
export * from "@/lib/erp-core/events/bootstrap/register-default-handlers";
export * from "@/lib/erp-core/events/delivery/notification-delivery-config";
export * from "@/lib/erp-core/events/delivery/in-app-notification-service";
export * from "@/lib/erp-core/events/handlers/notification-bridge-dispatch";
