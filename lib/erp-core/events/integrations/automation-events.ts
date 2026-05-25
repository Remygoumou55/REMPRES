/**
 * Bloc 3 Étape 7 — Publishers Automation / AI orchestration.
 */

import { publishIntegrationOfficialEvent } from "@/lib/erp-core/events/integrations/integration-publish";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

const AUTOMATION_DEPT_KEY = "ADMINISTRATION" as const;

export async function emitAutomationRuleTriggered(params: {
  actorUserId: string;
  ruleKey: string;
  eventId: string;
  eventType: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.AUTOMATION_RULE_TRIGGERED, {
    actorUserId: params.actorUserId,
    departmentKey: AUTOMATION_DEPT_KEY,
    entityType: "automation_rule",
    entityId: params.ruleKey,
    correlationId: params.eventId,
    payload: { event_type: params.eventType },
  });
}

export async function emitAutomationRuleExecuted(params: {
  actorUserId: string;
  ruleKey: string;
  actionKey: string;
  eventId: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.AUTOMATION_RULE_EXECUTED, {
    actorUserId: params.actorUserId,
    departmentKey: AUTOMATION_DEPT_KEY,
    entityType: "automation_rule",
    entityId: params.ruleKey,
    correlationId: params.eventId,
    payload: { action_key: params.actionKey },
  });
}

export async function emitAutomationRuleFailed(params: {
  actorUserId: string;
  ruleKey: string;
  eventId: string;
  reason: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.AUTOMATION_RULE_FAILED, {
    actorUserId: params.actorUserId,
    departmentKey: AUTOMATION_DEPT_KEY,
    entityType: "automation_rule",
    entityId: params.ruleKey,
    correlationId: params.eventId,
    payload: { reason: params.reason },
  });
}

export async function emitAutomationCrossDomainOrchestrated(params: {
  actorUserId: string;
  chainKey: string;
  sourceEventType: string;
  domains: string[];
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.AUTOMATION_CROSS_DOMAIN_ORCHESTRATED, {
    actorUserId: params.actorUserId,
    departmentKey: AUTOMATION_DEPT_KEY,
    entityType: "automation_chain",
    entityId: params.chainKey,
    correlationId: params.chainKey,
    payload: { source_event_type: params.sourceEventType, domains: params.domains },
  });
}

export async function emitAutomationAiRecommendationGenerated(params: {
  actorUserId: string;
  recommendationId: string;
  domainKey: string;
  confidence: number;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.AUTOMATION_AI_RECOMMENDATION_GENERATED, {
    actorUserId: params.actorUserId,
    departmentKey: AUTOMATION_DEPT_KEY,
    entityType: "erp_ai_recommendations",
    entityId: params.recommendationId,
    correlationId: params.recommendationId,
    payload: { domain_key: params.domainKey, confidence: params.confidence },
  });
}

export async function emitAutomationAiDecisionSupportEmitted(params: {
  actorUserId: string;
  supportKey: string;
  decisionType: string;
  confidence: number;
  sourceRefs: string[];
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.AUTOMATION_AI_DECISION_SUPPORT_EMITTED, {
    actorUserId: params.actorUserId,
    departmentKey: AUTOMATION_DEPT_KEY,
    entityType: "ai_decision_support",
    entityId: params.supportKey,
    correlationId: params.supportKey,
    payload: {
      decision_type: params.decisionType,
      confidence: params.confidence,
      source_refs: params.sourceRefs,
    },
  });
}

export async function emitAutomationReportGenerated(params: {
  actorUserId: string;
  reportId: string;
  successRatePct: number;
  executions24h: number;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.AUTOMATION_REPORT_GENERATED, {
    actorUserId: params.actorUserId,
    departmentKey: AUTOMATION_DEPT_KEY,
    entityType: "automation_cockpit_report",
    entityId: params.reportId,
    correlationId: params.reportId,
    payload: {
      success_rate_pct: params.successRatePct,
      executions_24h: params.executions24h,
    },
  });
}
