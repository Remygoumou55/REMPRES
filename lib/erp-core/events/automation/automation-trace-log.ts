/**
 * P6 — Trace exécutions automation (ring buffer in-process).
 */

export const ERP_AUTOMATION_TRACE_LOG_VERSION = "erp-automation-trace-p6-v1" as const;

export type AutomationTraceEntry = {
  id: string;
  at: string;
  ruleKey: string;
  actionKey: string;
  eventId: string;
  eventType: string;
  entityType: string | null;
  entityId: string | null;
  outcome: "executed" | "skipped_cooldown" | "skipped_no_match" | "error";
  detail?: string | null;
  metadata?: Record<string, unknown>;
};

const RING_MAX = 200;
const ring: AutomationTraceEntry[] = [];

export function appendAutomationTrace(entry: Omit<AutomationTraceEntry, "id" | "at">): void {
  ring.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    ...entry,
  });
  if (ring.length > RING_MAX) {
    ring.splice(0, ring.length - RING_MAX);
  }
}

export function getRecentAutomationTraces(limit = 50): readonly AutomationTraceEntry[] {
  return ring.slice(-limit);
}

export function clearAutomationTracesForTests(): void {
  ring.length = 0;
}
