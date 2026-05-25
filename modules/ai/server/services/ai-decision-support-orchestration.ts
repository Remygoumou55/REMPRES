/**
 * Bloc 3 Étape 7 — Decision support structuré (confiance + source, pas LLM décoratif).
 */

import type { ErpEventEnvelope } from "@/lib/erp-core/events/event-contracts";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { Json } from "@/types/database.types";
import {
  emitAutomationAiDecisionSupportEmitted,
  emitAutomationAiRecommendationGenerated,
} from "@/lib/erp-core/events/integrations/automation-events";

function clampConfidence(n: number): number {
  return Math.max(0, Math.min(1, Math.round(n * 10000) / 10000));
}

type DecisionSupportSpec = {
  supportKey: string;
  decisionType: string;
  domainKey: string;
  title: string;
  actionHint: string;
  confidence: number;
  sourceRefs: string[];
  rationale: Record<string, unknown>;
};

function buildSpecForEvent(event: ErpEventEnvelope): DecisionSupportSpec | null {
  switch (event.type) {
    case OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED:
      return {
        supportKey: `finance.threshold:${event.id}`,
        decisionType: "risk_suggestion",
        domainKey: "finance",
        title: "Seuil financier — revue trésorerie",
        actionHint: "Vérifier encaissements et valider plan de couverture CFO.",
        confidence: 0.72,
        sourceRefs: ["finance.threshold.exceeded", event.id],
        rationale: {
          threshold_key: event.payload.threshold_key,
          actual_gnf: event.payload.actual_gnf,
          threshold_gnf: event.payload.threshold_gnf,
        },
      };
    case OFFICIAL_ERP_EVENT_TYPES.EXECUTIVE_SIGNAL_RAISED:
      return {
        supportKey: `executive.signal:${event.entityId ?? event.id}`,
        decisionType: "workflow_assistance",
        domainKey: "executive",
        title: "Signal exécutif — triage prioritaire",
        actionHint: "Consulter le hub exécutif et valider l'action corrective.",
        confidence: 0.68,
        sourceRefs: ["executive.signal.raised", String(event.entityId ?? event.id)],
        rationale: {
          severity: event.payload.severity,
          source_domain: event.payload.source_domain,
        },
      };
    case OFFICIAL_ERP_EVENT_TYPES.EXECUTIVE_KPI_THRESHOLD_EXCEEDED:
      return {
        supportKey: `executive.kpi:${event.entityId ?? event.id}`,
        decisionType: "anomaly_detection",
        domainKey: "executive",
        title: "KPI hors seuil — analyse tendance",
        actionHint: "Comparer snapshot BI et déclencher revue direction si persistant.",
        confidence: 0.65,
        sourceRefs: ["executive.kpi.threshold_exceeded", String(event.entityId ?? "")],
        rationale: {
          value: event.payload.value,
          status: event.payload.status,
        },
      };
    case OFFICIAL_ERP_EVENT_TYPES.OBSERVABILITY_HEALTH_DEGRADED:
      return {
        supportKey: `obs.health:${event.id}`,
        decisionType: "risk_suggestion",
        domainKey: "observability",
        title: "Santé plateforme dégradée",
        actionHint: "Inspecter incidents ouverts et files infrastructure.",
        confidence: 0.7,
        sourceRefs: ["observability.health.degraded", event.id],
        rationale: {
          health_score: event.payload.health_score,
          previous_score: event.payload.previous_score,
        },
      };
    case OFFICIAL_ERP_EVENT_TYPES.AUTOMATION_RULE_FAILED:
      return {
        supportKey: `automation.fail:${event.entityId ?? event.id}`,
        decisionType: "workflow_assistance",
        domainKey: "automation",
        title: "Échec règle automation",
        actionHint: "Revoir la règle dans le cockpit automation et relancer si nécessaire.",
        confidence: 0.8,
        sourceRefs: ["automation.rule.failed", String(event.entityId ?? event.id)],
        rationale: { reason: event.payload.reason },
      };
    default:
      return null;
  }
}

export async function runAiDecisionSupportForEvent(
  event: ErpEventEnvelope,
  actorUserId: string,
): Promise<void> {
  const spec = buildSpecForEvent(event);
  if (!spec) return;

  const admin = getSupabaseAdminClient();
  const confidence = clampConfidence(spec.confidence);

  const { data: rec, error } = await admin
    .from("erp_ai_recommendations")
    .insert({
      recommendation_key: spec.supportKey,
      domain_key: spec.domainKey,
      entity_type: event.entityType,
      entity_id: event.entityId,
      priority: spec.decisionType === "risk_suggestion" ? 8 : 6,
      title: spec.title,
      action_hint: spec.actionHint,
      rationale: {
        ...spec.rationale,
        confidence,
        source_refs: spec.sourceRefs,
        decision_type: spec.decisionType,
      } as Json,
      status: "pending",
      metadata: { event_id: event.id, event_type: event.type },
    })
    .select("id")
    .single();

  if (error) {
    console.warn("[ai-decision-support]", error.message);
    return;
  }

  await emitAutomationAiRecommendationGenerated({
    actorUserId,
    recommendationId: rec.id,
    domainKey: spec.domainKey,
    confidence,
  });

  await emitAutomationAiDecisionSupportEmitted({
    actorUserId,
    supportKey: spec.supportKey,
    decisionType: spec.decisionType,
    confidence,
    sourceRefs: spec.sourceRefs,
  });
}
