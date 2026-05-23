/**
 * B3.2 — Traçabilité bus (ring buffer + lien audit gouvernance).
 */

import type { ErpEventEnvelope } from "@/lib/erp-core/events/event-contracts";
import { tryLogGovernanceAuditEvent } from "@/lib/governance/audit/log-audit-event";

export type ErpEventTraceEntry = {
  id: string;
  phase: "published" | "dispatched" | "handler_ok" | "handler_error";
  eventId: string;
  eventType: string;
  consumerKey?: string | null;
  detail?: string | null;
  at: string;
};

const TRACE_RING_MAX = 500;
const traceRing: ErpEventTraceEntry[] = [];

export function appendEventTrace(entry: Omit<ErpEventTraceEntry, "id" | "at">): void {
  traceRing.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    ...entry,
  });
  if (traceRing.length > TRACE_RING_MAX) {
    traceRing.splice(0, traceRing.length - TRACE_RING_MAX);
  }
}

export function getRecentEventTraces(limit = 50): readonly ErpEventTraceEntry[] {
  if (limit <= 0) return [];
  return traceRing.slice(-limit);
}

/** Tests uniquement. */
export function clearEventTracesForTests(): void {
  traceRing.length = 0;
}

export async function persistEventBusAudit(event: ErpEventEnvelope): Promise<void> {
  await tryLogGovernanceAuditEvent({
    category: "event",
    severity: "informational",
    departmentKey: event.departmentKey,
    actorUserId: event.actorUserId,
    actionType: "erp_event_published",
    entityType: event.entityType,
    entityId: event.entityId,
    metadata: {
      eventId: event.id,
      eventType: event.type,
      family: event.family,
      correlationId: event.correlationId,
      causationId: event.causationId,
    },
    afterSnapshot: event.payload,
  });
}
