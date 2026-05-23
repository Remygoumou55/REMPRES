/**
 * P2.1 — Notification bridge approval (read-only : map → log, pas de delivery).
 */

import type { ErpEventEnvelope } from "@/lib/erp-core/events/event-contracts";
import type { ErpNotificationCandidate } from "@/lib/erp-core/events/foundation/notification-foundation";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { registerErpEventHandler } from "@/lib/erp-core/events/event-registry";
import { processNotificationBridgeCandidate } from "@/lib/erp-core/events/handlers/notification-bridge-dispatch";

export const NOTIFICATION_APPROVAL_BRIDGE_CONSUMER_KEY = "notification-approval-bridge" as const;
export const NOTIFICATION_APPROVAL_BRIDGE_PATTERN = "approval.*" as const;

function requestLabel(event: ErpEventEnvelope): string {
  return event.entityId?.slice(0, 8) ?? "?";
}

export function mapApprovalEventToNotificationCandidate(
  event: ErpEventEnvelope,
): ErpNotificationCandidate | null {
  if (!event.type.startsWith("approval.")) return null;

  const mutationAction = String(event.payload.mutationAction ?? event.payload.mutation_action ?? "");
  const base = {
    sourceEventId: event.id,
    sourceEventType: event.type,
    departmentKey: event.departmentKey,
    entityType: event.entityType,
    entityId: event.entityId,
    channels: ["in_app"] as const,
    metadata: {
      ...event.payload,
      correlation_id: event.correlationId,
      mutation_action: mutationAction || null,
    },
  };

  switch (event.type) {
    case OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_CREATED:
      return {
        ...base,
        recipientScope: "super_admin",
        templateKey: "approval.request.created",
        title: "Approbation requise",
        body: mutationAction
          ? `Mutation « ${mutationAction} » — demande ${requestLabel(event)}`
          : `Nouvelle demande d'approbation ${requestLabel(event)}`,
        priority: "high",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_APPROVED:
      return {
        ...base,
        recipientScope: "actor",
        templateKey: "approval.request.approved",
        title: "Approbation accordée",
        body: mutationAction
          ? `« ${mutationAction} » approuvé — ${requestLabel(event)}`
          : `Demande ${requestLabel(event)} approuvée`,
        priority: "high",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_REJECTED: {
      const reason = String(event.payload.rejectionReason ?? "").trim();
      return {
        ...base,
        recipientScope: "actor",
        templateKey: "approval.request.rejected",
        title: "Approbation refusée",
        body: reason
          ? `Demande ${requestLabel(event)} refusée : ${reason}`
          : `Demande ${requestLabel(event)} refusée`,
        priority: "high",
        channels: [...base.channels],
      };
    }
    case OFFICIAL_ERP_EVENT_TYPES.APPROVAL_GATE_GRANTED:
      return {
        ...base,
        recipientScope: "actor",
        templateKey: "approval.gate.granted",
        title: "Gate approval ouverte",
        body: mutationAction
          ? `Vous pouvez exécuter « ${mutationAction} »`
          : `Mutation autorisée — ${requestLabel(event)}`,
        priority: "normal",
        channels: [...base.channels],
      };
    default:
      return null;
  }
}

export function registerNotificationApprovalBridgeHandler(): string {
  return registerErpEventHandler({
    pattern: NOTIFICATION_APPROVAL_BRIDGE_PATTERN,
    consumerKey: NOTIFICATION_APPROVAL_BRIDGE_CONSUMER_KEY,
    departmentScope: null,
    handler: async (event) => {
      const candidate = mapApprovalEventToNotificationCandidate(event);
      if (!candidate) return;
      await processNotificationBridgeCandidate({
        consumerKey: NOTIFICATION_APPROVAL_BRIDGE_CONSUMER_KEY,
        candidate,
        triggeredBy: event.actorUserId,
      });
    },
  });
}
