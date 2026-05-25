/**
 * Bloc 3 — Orchestration cross-domain → Operations.
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import type { ErpEventEnvelope } from "@/lib/erp-core/events/event-contracts";
import { registerErpEventHandler } from "@/lib/erp-core/events/event-registry";
import {
  orchestrateOpsDeliveryFromInventoryReceived,
  orchestrateOpsTaskFromDealWon,
  orchestrateOpsWorkflowFromApprovalApproved,
} from "@/modules/operations/server/services/ops-mutations";

export const OPS_ORCHESTRATION_BRIDGE_CONSUMER_KEY = "ops-orchestration-bridge" as const;

async function handleOrchestrationEvent(event: ErpEventEnvelope): Promise<void> {
  const actor = event.actorUserId;
  if (!actor) return;

  switch (event.type) {
    case OFFICIAL_ERP_EVENT_TYPES.CRM_DEAL_WON:
      await orchestrateOpsTaskFromDealWon({
        actorUserId: actor,
        opportunityId: event.entityId ?? "",
        amountGnf: Number(event.payload.amount_gnf ?? 0),
      });
      break;
    case OFFICIAL_ERP_EVENT_TYPES.SUPPLY_INVENTORY_RECEIVED:
      await orchestrateOpsDeliveryFromInventoryReceived({
        actorUserId: actor,
        receiptId: event.entityId ?? "",
        totalQty: Number(event.payload.total_qty ?? 0),
      });
      break;
    case OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_APPROVED:
      if (event.entityId) {
        await orchestrateOpsWorkflowFromApprovalApproved({
          actorUserId: actor,
          approvalRequestId: event.entityId,
        });
      }
      break;
    default:
      break;
  }
}

function wrapOrchestrationHandler(handler: (event: ErpEventEnvelope) => Promise<void>) {
  return async (event: ErpEventEnvelope) => {
    try {
      await handler(event);
    } catch (e) {
      console.warn("[ops-orchestration-bridge]", e instanceof Error ? e.message : e);
    }
  };
}

export function registerOpsOrchestrationBridgeHandler(): string {
  const h = wrapOrchestrationHandler(handleOrchestrationEvent);
  registerErpEventHandler({
    pattern: OFFICIAL_ERP_EVENT_TYPES.CRM_DEAL_WON,
    consumerKey: OPS_ORCHESTRATION_BRIDGE_CONSUMER_KEY,
    departmentScope: null,
    handler: h,
  });
  registerErpEventHandler({
    pattern: OFFICIAL_ERP_EVENT_TYPES.SUPPLY_INVENTORY_RECEIVED,
    consumerKey: OPS_ORCHESTRATION_BRIDGE_CONSUMER_KEY,
    departmentScope: null,
    handler: h,
  });
  return registerErpEventHandler({
    pattern: OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_APPROVED,
    consumerKey: OPS_ORCHESTRATION_BRIDGE_CONSUMER_KEY,
    departmentScope: null,
    handler: h,
  });
}
