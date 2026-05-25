/**
 * Bloc 3 Étape 7 — AI orchestration gouvernée (decision support structuré, pas chatbot).
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import type { ErpEventEnvelope } from "@/lib/erp-core/events/event-contracts";
import { registerErpEventHandler } from "@/lib/erp-core/events/event-registry";
import { runAiDecisionSupportForEvent } from "@/modules/ai/server/services/ai-decision-support-orchestration";

export const AI_ORCHESTRATION_BRIDGE_CONSUMER_KEY = "ai-orchestration-bridge" as const;

const AI_TRIGGER_EVENTS = [
  OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED,
  OFFICIAL_ERP_EVENT_TYPES.EXECUTIVE_SIGNAL_RAISED,
  OFFICIAL_ERP_EVENT_TYPES.EXECUTIVE_KPI_THRESHOLD_EXCEEDED,
  OFFICIAL_ERP_EVENT_TYPES.OBSERVABILITY_HEALTH_DEGRADED,
  OFFICIAL_ERP_EVENT_TYPES.AUTOMATION_RULE_FAILED,
] as const;

async function handleAiOrchestration(event: ErpEventEnvelope): Promise<void> {
  if (event.type.startsWith("automation.ai.")) return;
  const actor = event.actorUserId;
  if (!actor) return;
  await runAiDecisionSupportForEvent(event, actor);
}

function wrap(handler: (event: ErpEventEnvelope) => Promise<void>) {
  return async (event: ErpEventEnvelope) => {
    try {
      await handler(event);
    } catch (e) {
      console.warn("[ai-orchestration-bridge]", e instanceof Error ? e.message : e);
    }
  };
}

export function registerAiOrchestrationBridgeHandler(): string {
  const h = wrap(handleAiOrchestration);
  let lastId = "";
  for (const pattern of AI_TRIGGER_EVENTS) {
    lastId = registerErpEventHandler({
      pattern,
      consumerKey: AI_ORCHESTRATION_BRIDGE_CONSUMER_KEY,
      departmentScope: null,
      handler: h,
    });
  }
  return lastId;
}
