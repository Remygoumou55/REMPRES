/**
 * Bloc 3 Étape 7 — Persistance best-effort des traces automation (SQL + bus append-only).
 */

import type { AutomationTraceEntry } from "@/lib/erp-core/events/automation/automation-trace-log";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { Json } from "@/types/database.types";

export const ERP_AUTOMATION_PERSISTENCE_VERSION = "erp-automation-persistence-bloc3-v1" as const;

export async function persistAutomationRuleExecution(entry: AutomationTraceEntry): Promise<void> {
  try {
    const admin = getSupabaseAdminClient();
    const { error } = await admin.from("erp_automation_rule_executions").insert({
      rule_key: entry.ruleKey,
      action_key: entry.actionKey,
      event_id: entry.eventId,
      event_type: entry.eventType,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      outcome: entry.outcome,
      detail: entry.detail ?? null,
      metadata: (entry.metadata ?? {}) as Json,
    });
    if (error) {
      console.warn("[automation-persistence]", error.message);
    }
  } catch (e) {
    console.warn("[automation-persistence]", e instanceof Error ? e.message : e);
  }
}

export async function persistAutomationBusEvent(params: {
  eventKey: string;
  domainKey: string;
  aggregateType: string;
  aggregateId: string;
  correlationId: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = getSupabaseAdminClient();
    const { error } = await admin.from("erp_automation_events").insert({
      event_key: params.eventKey,
      domain_key: params.domainKey,
      aggregate_type: params.aggregateType,
      aggregate_id: params.aggregateId,
      correlation_id: params.correlationId,
      payload: params.payload as Json,
      created_by: null,
    });
    if (error) {
      console.warn("[automation-persistence:bus]", error.message);
    }
  } catch (e) {
    console.warn("[automation-persistence:bus]", e instanceof Error ? e.message : e);
  }
}
