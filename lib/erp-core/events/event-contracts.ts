/**
 * B3.2 — Contrats événements ERP (domain model).
 */

import { ERP_EVENT_BUS_VERSION } from "@/lib/erp-core/events/version";

export const ERP_EVENT_FAMILIES = [
  "domain",
  "runtime",
  "mutation",
  "approval",
  "audit",
  "notification_candidate",
] as const;

export type ErpEventFamily = (typeof ERP_EVENT_FAMILIES)[number];

export const ERP_EVENT_SENSITIVITIES = ["public", "internal", "restricted"] as const;

export type ErpEventSensitivity = (typeof ERP_EVENT_SENSITIVITIES)[number];

/** Format normatif : domain.entity.action (ex. crm.quote.converted). */
export type ErpEventType = string;

export type ErpEventPayload = Record<string, unknown>;

export type ErpEventEnvelope = {
  id: string;
  type: ErpEventType;
  version: typeof ERP_EVENT_BUS_VERSION;
  family: ErpEventFamily;
  sensitivity: ErpEventSensitivity;
  occurredAt: string;
  actorUserId: string | null;
  departmentKey: string | null;
  entityType: string | null;
  entityId: string | null;
  payload: ErpEventPayload;
  correlationId: string | null;
  causationId: string | null;
};

export type DomainEvent = ErpEventEnvelope & { family: "domain" };
export type RuntimeEvent = ErpEventEnvelope & { family: "runtime" };
export type MutationEvent = ErpEventEnvelope & { family: "mutation" };
export type ApprovalEvent = ErpEventEnvelope & { family: "approval" };
export type AuditEvent = ErpEventEnvelope & { family: "audit" };
export type NotificationCandidateEvent = ErpEventEnvelope & {
  family: "notification_candidate";
};

export type ErpEventHandler = (event: ErpEventEnvelope) => void | Promise<void>;

export type ErpEventHandlerRegistration = {
  id: string;
  pattern: string;
  handler: ErpEventHandler;
  consumerKey: string;
  departmentScope: string | null;
};
