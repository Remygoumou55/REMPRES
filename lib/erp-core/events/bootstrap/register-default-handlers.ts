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
  NOTIFICATION_SUPPLY_BRIDGE_CONSUMER_KEY,
  registerNotificationSupplyBridgeHandler,
} from "@/lib/erp-core/events/handlers/notification-supply-bridge";
import {
  NOTIFICATION_OPS_BRIDGE_CONSUMER_KEY,
  registerNotificationOpsBridgeHandler,
} from "@/lib/erp-core/events/handlers/notification-ops-bridge";
import {
  OPS_ORCHESTRATION_BRIDGE_CONSUMER_KEY,
  registerOpsOrchestrationBridgeHandler,
} from "@/lib/erp-core/events/handlers/ops-orchestration-bridge";
import {
  ERP_AUTOMATION_ENGINE_CONSUMER_KEY,
  registerErpAutomationEngineHandler,
} from "@/lib/erp-core/events/handlers/automation-engine-handler";
import {
  AUTOMATION_ORCHESTRATION_BRIDGE_CONSUMER_KEY,
  registerAutomationOrchestrationBridgeHandler,
} from "@/lib/erp-core/events/handlers/automation-orchestration-bridge";
import {
  AI_ORCHESTRATION_BRIDGE_CONSUMER_KEY,
  registerAiOrchestrationBridgeHandler,
} from "@/lib/erp-core/events/handlers/ai-orchestration-bridge";

export const ERP_EVENT_HANDLERS_BOOTSTRAP_VERSION = "erp-event-handlers-bootstrap-bloc3-automation-v1" as const;

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
  if (!hasHandler(NOTIFICATION_SUPPLY_BRIDGE_CONSUMER_KEY)) {
    registerNotificationSupplyBridgeHandler();
  }
  if (!hasHandler(NOTIFICATION_OPS_BRIDGE_CONSUMER_KEY)) {
    registerNotificationOpsBridgeHandler();
  }
  if (!hasHandler(OPS_ORCHESTRATION_BRIDGE_CONSUMER_KEY)) {
    registerOpsOrchestrationBridgeHandler();
  }
  if (!hasHandler(ERP_AUTOMATION_ENGINE_CONSUMER_KEY)) {
    registerErpAutomationEngineHandler();
  }
  if (!hasHandler(AUTOMATION_ORCHESTRATION_BRIDGE_CONSUMER_KEY)) {
    registerAutomationOrchestrationBridgeHandler();
  }
  if (!hasHandler(AI_ORCHESTRATION_BRIDGE_CONSUMER_KEY)) {
    registerAiOrchestrationBridgeHandler();
  }

  bootstrapped = true;
}

/** Tests uniquement — reset état bootstrap. */
export function resetErpEventHandlersBootstrapForTests(): void {
  bootstrapped = false;
}
