/**
 * P2 — Notification bridge CRM (read-only : map → log, pas de delivery).
 */

import type { ErpEventEnvelope } from "@/lib/erp-core/events/event-contracts";
import type { ErpNotificationCandidate } from "@/lib/erp-core/events/foundation/notification-foundation";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { registerErpEventHandler } from "@/lib/erp-core/events/event-registry";
import { processNotificationBridgeCandidate } from "@/lib/erp-core/events/handlers/notification-bridge-dispatch";

export const NOTIFICATION_CRM_BRIDGE_CONSUMER_KEY = "notification-crm-bridge" as const;
export const NOTIFICATION_CRM_BRIDGE_PATTERN = "crm.*" as const;

function entityLabel(event: ErpEventEnvelope): string {
  const id = event.entityId?.slice(0, 8) ?? "?";
  return `${event.entityType ?? "entity"}:${id}`;
}

export function mapCrmEventToNotificationCandidate(
  event: ErpEventEnvelope,
): ErpNotificationCandidate | null {
  if (!event.type.startsWith("crm.")) return null;

  const base = {
    sourceEventId: event.id,
    sourceEventType: event.type,
    departmentKey: event.departmentKey,
    entityType: event.entityType,
    entityId: event.entityId,
    channels: ["in_app"] as const,
    metadata: { ...event.payload, correlation_id: event.correlationId },
  };

  switch (event.type) {
    case OFFICIAL_ERP_EVENT_TYPES.CRM_LEAD_CREATED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "crm.lead.created",
        title: "Nouveau lead CRM",
        body: `Lead créé — ${String(event.payload.company_name ?? entityLabel(event))}`,
        priority: "normal",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CREATED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "crm.quote.created",
        title: "Nouveau devis",
        body: `Devis ${String(event.payload.quote_number ?? event.entityId?.slice(0, 8) ?? "")} créé`,
        priority: "normal",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_STATUS_UPDATED: {
      const toStatus = String(event.payload.to_status ?? "");
      return {
        ...base,
        recipientScope: toStatus === "accepted" ? "approvers" : "department",
        templateKey: "crm.quote.status_updated",
        title: "Statut devis mis à jour",
        body: `Devis ${String(event.payload.quote_number ?? "")} : ${String(event.payload.from_status)} → ${toStatus}`,
        priority: toStatus === "accepted" ? "high" : "normal",
        channels: [...base.channels],
      };
    }
    case OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CONVERT_REQUESTED:
      return {
        ...base,
        recipientScope: "approvers",
        templateKey: "crm.quote.convert_requested",
        title: "Conversion devis demandée",
        body: `Demande conversion devis ${entityLabel(event)}`,
        priority: "high",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CONVERTED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "crm.quote.converted",
        title: "Devis converti en vente",
        body: `Vente ${String(event.payload.sale_reference ?? event.payload.sale_id ?? "")}`,
        priority: "high",
        channels: [...base.channels],
      };
    default:
      return null;
  }
}

/** P3 — trace + delivery in_app via bus (remplace alerts directs approval/crm couverts). */
export function registerNotificationCrmBridgeHandler(): string {
  return registerErpEventHandler({
    pattern: NOTIFICATION_CRM_BRIDGE_PATTERN,
    consumerKey: NOTIFICATION_CRM_BRIDGE_CONSUMER_KEY,
    departmentScope: "VENTE",
    handler: async (event) => {
      const candidate = mapCrmEventToNotificationCandidate(event);
      if (!candidate) return;
      await processNotificationBridgeCandidate({
        consumerKey: NOTIFICATION_CRM_BRIDGE_CONSUMER_KEY,
        candidate,
        triggeredBy: event.actorUserId,
      });
    },
  });
}
