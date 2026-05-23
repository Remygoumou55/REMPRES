/**
 * P8 — BUS_TRACE_FOUNDATION (lifecycle bus — facade sur event-traceability).
 */

import type { ErpEventTraceEntry } from "@/lib/erp-core/events/event-traceability";

export const BUS_TRACE_FOUNDATION_VERSION = "bus-trace-foundation-p8-v1" as const;

export const BUS_TRACE_FOUNDATION = {
  version: BUS_TRACE_FOUNDATION_VERSION,
  storage: "in_process_ring",
  sourceModule: "lib/erp-core/events/event-traceability.ts",
  maxEntries: 500,
  externalTelemetryForbidden: true,
  dbPersistenceForbidden: true,
} as const;

export type BusTraceLifecyclePhase =
  | "event_published"
  | "handler_invoked"
  | "handler_completed"
  | "handler_failed";

export type BusTraceMapEntry = {
  lifecyclePhase: BusTraceLifecyclePhase;
  sourcePhase: ErpEventTraceEntry["phase"];
  description: string;
};

/** BUS_TRACE_MAP — mapping officiel lifecycle → traces existantes. */
export const BUS_TRACE_MAP: readonly BusTraceMapEntry[] = [
  {
    lifecyclePhase: "event_published",
    sourcePhase: "published",
    description: "publishErpEvent — post assertCanPublishEvent",
  },
  {
    lifecyclePhase: "handler_invoked",
    sourcePhase: "dispatched",
    description: "dispatchErpEvent — avant handler",
  },
  {
    lifecyclePhase: "handler_completed",
    sourcePhase: "handler_ok",
    description: "Handler terminé sans erreur",
  },
  {
    lifecyclePhase: "handler_failed",
    sourcePhase: "handler_error",
    description: "Handler erreur — visible section failures",
  },
] as const;

export type BusTraceView = {
  id: string;
  lifecyclePhase: BusTraceLifecyclePhase;
  eventId: string;
  eventType: string;
  consumerKey: string | null;
  detail: string | null;
  at: string;
};

const PHASE_TO_LIFECYCLE: Record<ErpEventTraceEntry["phase"], BusTraceLifecyclePhase> = {
  published: "event_published",
  dispatched: "handler_invoked",
  handler_ok: "handler_completed",
  handler_error: "handler_failed",
};

export function mapEventTraceToBusTraceView(entry: ErpEventTraceEntry): BusTraceView {
  return {
    id: entry.id,
    lifecyclePhase: PHASE_TO_LIFECYCLE[entry.phase],
    eventId: entry.eventId,
    eventType: entry.eventType,
    consumerKey: entry.consumerKey ?? null,
    detail: entry.detail ?? null,
    at: entry.at,
  };
}
