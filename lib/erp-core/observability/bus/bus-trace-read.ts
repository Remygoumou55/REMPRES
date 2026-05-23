/**
 * P8 — Read API traces bus (ring buffer existant).
 */

import {
  getRecentEventTraces,
  type ErpEventTraceEntry,
} from "@/lib/erp-core/events/event-traceability";
import {
  mapEventTraceToBusTraceView,
  type BusTraceView,
} from "@/lib/erp-core/observability/bus/bus-trace-foundation";

export function readRecentBusTraces(limit = 50): readonly BusTraceView[] {
  return getRecentEventTraces(limit).map(mapEventTraceToBusTraceView);
}

export function readBusTraceFailures(limit = 30): readonly BusTraceView[] {
  return getRecentEventTraces(500)
    .filter((e) => e.phase === "handler_error")
    .slice(-limit)
    .map(mapEventTraceToBusTraceView);
}

export function filterBusTracesByEventTypePrefix(
  traces: readonly BusTraceView[],
  allowedPrefixes: readonly string[] | null,
): BusTraceView[] {
  if (!allowedPrefixes || allowedPrefixes.length === 0) return [...traces];
  return traces.filter((t) =>
    allowedPrefixes.some((p) => t.eventType === p.replace(/\.$/, "") || t.eventType.startsWith(p)),
  );
}

export function groupBusTracesByEventId(traces: readonly BusTraceView[]): Map<string, BusTraceView[]> {
  const map = new Map<string, BusTraceView[]>();
  for (const t of traces) {
    const list = map.get(t.eventId) ?? [];
    list.push(t);
    map.set(t.eventId, list);
  }
  return map;
}

export function toRawEventTracesForTests(): readonly ErpEventTraceEntry[] {
  return getRecentEventTraces(500);
}
