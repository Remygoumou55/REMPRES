/**
 * P2 / P2.1 — Bootstrap handlers bus (idempotent, in-process).
 */

import { listErpEventHandlers } from "@/lib/erp-core/events/event-registry";
import {
  NOTIFICATION_CRM_BRIDGE_CONSUMER_KEY,
  registerNotificationCrmBridgeHandler,
} from "@/lib/erp-core/events/handlers/notification-crm-bridge";
import {
  NOTIFICATION_APPROVAL_BRIDGE_CONSUMER_KEY,
  registerNotificationApprovalBridgeHandler,
} from "@/lib/erp-core/events/handlers/notification-approval-bridge";

export const ERP_EVENT_HANDLERS_BOOTSTRAP_VERSION = "erp-event-handlers-bootstrap-p3-v1" as const;

let bootstrapped = false;

function hasHandler(consumerKey: string): boolean {
  return listErpEventHandlers().some((h) => h.consumerKey === consumerKey);
}

export function ensureErpEventHandlersBootstrapped(): void {
  if (bootstrapped) return;

  if (!hasHandler(NOTIFICATION_CRM_BRIDGE_CONSUMER_KEY)) {
    registerNotificationCrmBridgeHandler();
  }
  if (!hasHandler(NOTIFICATION_APPROVAL_BRIDGE_CONSUMER_KEY)) {
    registerNotificationApprovalBridgeHandler();
  }

  bootstrapped = true;
}

/** Tests uniquement — reset état bootstrap. */
export function resetErpEventHandlersBootstrapForTests(): void {
  bootstrapped = false;
}
