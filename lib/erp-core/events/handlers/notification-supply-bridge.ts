/**
 * Bloc 3 — Notification bridge Supply (pattern crm.* / supply.*).
 */

import type { ErpEventEnvelope } from "@/lib/erp-core/events/event-contracts";
import type { ErpNotificationCandidate } from "@/lib/erp-core/events/foundation/notification-foundation";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { registerErpEventHandler } from "@/lib/erp-core/events/event-registry";
import { processNotificationBridgeCandidate } from "@/lib/erp-core/events/handlers/notification-bridge-dispatch";

export const NOTIFICATION_SUPPLY_BRIDGE_CONSUMER_KEY = "notification-supply-bridge" as const;
export const NOTIFICATION_SUPPLY_BRIDGE_PATTERN = "supply.*" as const;

export function mapSupplyEventToNotificationCandidate(
  event: ErpEventEnvelope,
): ErpNotificationCandidate | null {
  if (!event.type.startsWith("supply.")) return null;

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
    case OFFICIAL_ERP_EVENT_TYPES.SUPPLY_SUPPLIER_CREATED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "supply.supplier.created",
        title: "Nouveau fournisseur",
        body: String(event.payload.company_name ?? ""),
        priority: "normal",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.SUPPLY_PO_CREATED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "supply.po.created",
        title: "Commande achat créée",
        body: String(event.payload.po_number ?? ""),
        priority: "normal",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.SUPPLY_PURCHASE_REQUESTED:
      return {
        ...base,
        recipientScope: "approvers",
        templateKey: "supply.purchase.requested",
        title: "Achat soumis",
        body: `PO ${String(event.payload.po_number ?? "")}`,
        priority: "high",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.SUPPLY_PURCHASE_APPROVED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "supply.purchase.approved",
        title: "Commande approuvée",
        body: String(event.payload.po_number ?? ""),
        priority: "normal",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.SUPPLY_INVENTORY_RECEIVED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "supply.inventory.received",
        title: "Réception stock",
        body: `${event.payload.total_qty ?? 0} unités`,
        priority: "normal",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.SUPPLY_STOCK_ADJUSTED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "supply.stock.adjusted",
        title: "Ajustement stock",
        body: `Δ ${event.payload.qty_signed ?? 0}`,
        priority: "normal",
        channels: [...base.channels],
      };
    default:
      return {
        ...base,
        recipientScope: "department",
        templateKey: event.type,
        title: "Événement supply",
        body: event.type,
        priority: "low",
        channels: [...base.channels],
      };
  }
}

export function registerNotificationSupplyBridgeHandler(): string {
  return registerErpEventHandler({
    pattern: NOTIFICATION_SUPPLY_BRIDGE_PATTERN,
    consumerKey: NOTIFICATION_SUPPLY_BRIDGE_CONSUMER_KEY,
    departmentScope: "LOGISTIQUE",
    handler: async (event) => {
      const candidate = mapSupplyEventToNotificationCandidate(event);
      if (!candidate) return;
      await processNotificationBridgeCandidate({
        consumerKey: NOTIFICATION_SUPPLY_BRIDGE_CONSUMER_KEY,
        candidate,
        triggeredBy: event.actorUserId,
      });
    },
  });
}
