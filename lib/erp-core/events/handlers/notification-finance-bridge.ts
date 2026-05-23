/**
 * P5 — Notification bridge Finance (map → trace → dispatch → delivery in_app).
 */

import type { ErpEventEnvelope } from "@/lib/erp-core/events/event-contracts";
import type { ErpNotificationCandidate } from "@/lib/erp-core/events/foundation/notification-foundation";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { registerErpEventHandler } from "@/lib/erp-core/events/event-registry";
import { processNotificationBridgeCandidate } from "@/lib/erp-core/events/handlers/notification-bridge-dispatch";

export const NOTIFICATION_FINANCE_BRIDGE_CONSUMER_KEY = "notification-finance-bridge" as const;
export const NOTIFICATION_FINANCE_BRIDGE_PATTERN = "finance.*" as const;

function entityLabel(event: ErpEventEnvelope): string {
  const id = event.entityId?.slice(0, 8) ?? "?";
  return `${event.entityType ?? "entity"}:${id}`;
}

function formatGnf(amount: unknown): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

export function mapFinanceEventToNotificationCandidate(
  event: ErpEventEnvelope,
): ErpNotificationCandidate | null {
  if (!event.type.startsWith("finance.")) return null;

  const base = {
    sourceEventId: event.id,
    sourceEventType: event.type,
    departmentKey: event.departmentKey ?? "FINANCE",
    entityType: event.entityType,
    entityId: event.entityId,
    channels: ["in_app"] as const,
    metadata: { ...event.payload, correlation_id: event.correlationId },
  };

  switch (event.type) {
    case OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_CREATED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "finance.expense.created",
        title: "Nouvelle dépense",
        body: `Dépense ${formatGnf(event.payload.amount_gnf)} — ${String(event.payload.category ?? entityLabel(event))}`,
        priority: "normal",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_UPDATED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "finance.expense.updated",
        title: "Dépense modifiée",
        body: `Mise à jour ${formatGnf(event.payload.amount_gnf)} — ${entityLabel(event)}`,
        priority: "normal",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_RECORDED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "finance.transaction.recorded",
        title: "Transaction enregistrée",
        body: `${String(event.payload.source_type ?? "transaction")} ${formatGnf(event.payload.amount_gnf)}`,
        priority: "normal",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_FAILED:
      return {
        ...base,
        recipientScope: "super_admin",
        templateKey: "finance.transaction.failed",
        title: "Échec transaction finance",
        body: String(event.payload.message ?? event.payload.failure_code ?? entityLabel(event)),
        priority: "high",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED:
      return {
        ...base,
        recipientScope: "super_admin",
        templateKey: "finance.threshold.exceeded",
        title: "Seuil financier dépassé",
        body: `${String(event.payload.threshold_key ?? "seuil")} : ${formatGnf(event.payload.actual_gnf)} / ${formatGnf(event.payload.threshold_gnf)}`,
        priority: "high",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.FINANCE_PAYMENT_RECORDED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "finance.payment.recorded",
        title: "Paiement enregistré",
        body: `Paiement ${formatGnf(event.payload.amount_gnf)} — ${entityLabel(event)}`,
        priority: "high",
        channels: [...base.channels],
      };
    default:
      return null;
  }
}

export function registerNotificationFinanceBridgeHandler(): string {
  return registerErpEventHandler({
    pattern: NOTIFICATION_FINANCE_BRIDGE_PATTERN,
    consumerKey: NOTIFICATION_FINANCE_BRIDGE_CONSUMER_KEY,
    departmentScope: "FINANCE",
    handler: async (event) => {
      const candidate = mapFinanceEventToNotificationCandidate(event);
      if (!candidate) return;
      await processNotificationBridgeCandidate({
        consumerKey: NOTIFICATION_FINANCE_BRIDGE_CONSUMER_KEY,
        candidate,
        triggeredBy: event.actorUserId,
      });
    },
  });
}
