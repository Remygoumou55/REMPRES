/**
 * P2 / P2.1 / P5 / P6 / P7.2 — Bootstrap handlers bus (idempotent, in-process).
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
import {
  NOTIFICATION_FINANCE_BRIDGE_CONSUMER_KEY,
  registerNotificationFinanceBridgeHandler,
} from "@/lib/erp-core/events/handlers/notification-finance-bridge";
import {
  NOTIFICATION_HR_BRIDGE_CONSUMER_KEY,
  registerNotificationHrBridgeHandler,
} from "@/lib/erp-core/events/handlers/notification-hr-bridge";
import {
  ERP_AUTOMATION_ENGINE_CONSUMER_KEY,
  registerErpAutomationEngineHandler,
} from "@/lib/erp-core/events/handlers/automation-engine-handler";

export const ERP_EVENT_HANDLERS_BOOTSTRAP_VERSION = "erp-event-handlers-bootstrap-p7-2-v1" as const;

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
  if (!hasHandler(NOTIFICATION_FINANCE_BRIDGE_CONSUMER_KEY)) {
    registerNotificationFinanceBridgeHandler();
  }
  if (!hasHandler(NOTIFICATION_HR_BRIDGE_CONSUMER_KEY)) {
    registerNotificationHrBridgeHandler();
  }
  if (!hasHandler(ERP_AUTOMATION_ENGINE_CONSUMER_KEY)) {
    registerErpAutomationEngineHandler();
  }

  bootstrapped = true;
}

/** Tests uniquement — reset état bootstrap. */
export function resetErpEventHandlersBootstrapForTests(): void {
  bootstrapped = false;
}
