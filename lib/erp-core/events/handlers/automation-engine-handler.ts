/**
 * P6 — Handler bus central automation (pattern * → rule engine).
 */

import { registerErpEventHandler } from "@/lib/erp-core/events/event-registry";
import { runAutomationEngineForEvent } from "@/lib/erp-core/events/automation/automation-rule-engine";

export const ERP_AUTOMATION_ENGINE_CONSUMER_KEY = "erp-automation-engine" as const;
export const ERP_AUTOMATION_ENGINE_PATTERN = "*" as const;

export function registerErpAutomationEngineHandler(): string {
  return registerErpEventHandler({
    pattern: ERP_AUTOMATION_ENGINE_PATTERN,
    consumerKey: ERP_AUTOMATION_ENGINE_CONSUMER_KEY,
    departmentScope: null,
    handler: async (event) => {
      await runAutomationEngineForEvent(event);
    },
  });
}
