/**
 * Bloc 3 — Notification bridge Operations (pattern ops.*).
 */

import type { ErpEventEnvelope } from "@/lib/erp-core/events/event-contracts";
import type { ErpNotificationCandidate } from "@/lib/erp-core/events/foundation/notification-foundation";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { registerErpEventHandler } from "@/lib/erp-core/events/event-registry";
import { processNotificationBridgeCandidate } from "@/lib/erp-core/events/handlers/notification-bridge-dispatch";
import { OPERATIONS_DEPARTMENT_KEY } from "@/modules/operations/constants/module-keys";

export const NOTIFICATION_OPS_BRIDGE_CONSUMER_KEY = "notification-ops-bridge" as const;
export const NOTIFICATION_OPS_BRIDGE_PATTERN = "ops.*" as const;

export function mapOpsEventToNotificationCandidate(
  event: ErpEventEnvelope,
): ErpNotificationCandidate | null {
  if (!event.type.startsWith("ops.")) return null;

  const base = {
    sourceEventId: event.id,
    sourceEventType: event.type,
    departmentKey: event.departmentKey ?? OPERATIONS_DEPARTMENT_KEY,
    entityType: event.entityType,
    entityId: event.entityId,
    channels: ["in_app"] as const,
    metadata: { ...event.payload, correlation_id: event.correlationId },
  };

  switch (event.type) {
    case OFFICIAL_ERP_EVENT_TYPES.OPS_TASK_CREATED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "ops.task.created",
        title: "Nouvelle tâche",
        body: String(event.payload.title ?? ""),
        priority: "normal",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.OPS_TASK_ASSIGNED:
      return {
        ...base,
        recipientScope: "actor",
        templateKey: "ops.task.assigned",
        title: "Tâche assignée",
        body: "Une tâche vous a été assignée.",
        priority: "high",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.OPS_WORKFLOW_STARTED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "ops.workflow.started",
        title: "Workflow démarré",
        body: String(event.payload.workflow_code ?? ""),
        priority: "normal",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.OPS_PROJECT_CREATED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "ops.project.created",
        title: "Projet créé",
        body: String(event.payload.title ?? ""),
        priority: "normal",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.OPS_EXECUTION_DELAYED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "ops.execution.delayed",
        title: "Retard livraison",
        body: String(event.payload.delay_reason ?? ""),
        priority: "high",
        channels: [...base.channels],
      };
    default:
      return {
        ...base,
        recipientScope: "department",
        templateKey: event.type,
        title: "Événement operations",
        body: event.type,
        priority: "low",
        channels: [...base.channels],
      };
  }
}

export function registerNotificationOpsBridgeHandler(): string {
  return registerErpEventHandler({
    pattern: NOTIFICATION_OPS_BRIDGE_PATTERN,
    consumerKey: NOTIFICATION_OPS_BRIDGE_CONSUMER_KEY,
    departmentScope: OPERATIONS_DEPARTMENT_KEY,
    handler: async (event) => {
      const candidate = mapOpsEventToNotificationCandidate(event);
      if (!candidate) return;
      await processNotificationBridgeCandidate({
        consumerKey: NOTIFICATION_OPS_BRIDGE_CONSUMER_KEY,
        candidate,
        triggeredBy: event.actorUserId,
      });
    },
  });
}
