/**
 * Bloc 3 Étape 7 — Orchestration multi-domaines (trace + bus officiel).
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import type { ErpEventEnvelope } from "@/lib/erp-core/events/event-contracts";
import { registerErpEventHandler } from "@/lib/erp-core/events/event-registry";
import { emitAutomationCrossDomainOrchestrated } from "@/lib/erp-core/events/integrations/automation-events";
import { persistAutomationBusEvent } from "@/lib/erp-core/events/automation/automation-persistence";

export const AUTOMATION_ORCHESTRATION_BRIDGE_CONSUMER_KEY = "automation-orchestration-bridge" as const;

const CHAIN_MAP: Record<string, { chainKey: string; domains: string[] }> = {
  [OFFICIAL_ERP_EVENT_TYPES.CRM_DEAL_WON]: {
    chainKey: "bloc3.crm_deal_won_chain",
    domains: ["crm", "finance", "operations", "executive"],
  },
  [OFFICIAL_ERP_EVENT_TYPES.SUPPLY_PURCHASE_REQUESTED]: {
    chainKey: "bloc3.supply_purchase_chain",
    domains: ["supply", "approval", "notification"],
  },
  [OFFICIAL_ERP_EVENT_TYPES.EXECUTIVE_SIGNAL_RAISED]: {
    chainKey: "bloc3.executive_signal_chain",
    domains: ["executive", "automation", "ai"],
  },
  [OFFICIAL_ERP_EVENT_TYPES.OBSERVABILITY_HEALTH_DEGRADED]: {
    chainKey: "bloc3.observability_health_chain",
    domains: ["observability", "executive"],
  },
};

async function handleCrossDomainOrchestration(event: ErpEventEnvelope): Promise<void> {
  const actor = event.actorUserId;
  if (!actor) return;

  const chain = CHAIN_MAP[event.type];
  if (!chain) return;

  await emitAutomationCrossDomainOrchestrated({
    actorUserId: actor,
    chainKey: chain.chainKey,
    sourceEventType: event.type,
    domains: chain.domains,
  });

  await persistAutomationBusEvent({
    eventKey: "automation.cross_domain.orchestrated",
    domainKey: "cross_domain",
    aggregateType: "automation_chain",
    aggregateId: chain.chainKey,
    correlationId: event.id,
    payload: {
      source_event_type: event.type,
      domains: chain.domains,
    },
  });
}

function wrap(handler: (event: ErpEventEnvelope) => Promise<void>) {
  return async (event: ErpEventEnvelope) => {
    try {
      await handler(event);
    } catch (e) {
      console.warn("[automation-orchestration-bridge]", e instanceof Error ? e.message : e);
    }
  };
}

export function registerAutomationOrchestrationBridgeHandler(): string {
  const h = wrap(handleCrossDomainOrchestration);
  let lastId = "";
  for (const pattern of Object.keys(CHAIN_MAP)) {
    lastId = registerErpEventHandler({
      pattern,
      consumerKey: AUTOMATION_ORCHESTRATION_BRIDGE_CONSUMER_KEY,
      departmentScope: null,
      handler: h,
    });
  }
  return lastId;
}
