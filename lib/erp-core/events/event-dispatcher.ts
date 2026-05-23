/**
 * B3.2 — Dispatch in-process vers handlers enregistrés.
 */

import type { ErpEventEnvelope } from "@/lib/erp-core/events/event-contracts";
import { findHandlersForEvent } from "@/lib/erp-core/events/event-registry";
import { assertCanSubscribe } from "@/lib/erp-core/events/event-security";
import { appendEventTrace } from "@/lib/erp-core/events/event-traceability";

export async function dispatchErpEvent(event: ErpEventEnvelope): Promise<void> {
  const matched = findHandlersForEvent(event.type);

  appendEventTrace({
    phase: "dispatched",
    eventId: event.id,
    eventType: event.type,
    detail: `${matched.length} handler(s)`,
  });

  for (const reg of matched) {
    if (
      !assertCanSubscribe(
        { consumerKey: reg.consumerKey, departmentScope: reg.departmentScope },
        event,
      )
    ) {
      continue;
    }

    try {
      await reg.handler(event);
      appendEventTrace({
        phase: "handler_ok",
        eventId: event.id,
        eventType: event.type,
        consumerKey: reg.consumerKey,
      });
    } catch (e) {
      appendEventTrace({
        phase: "handler_error",
        eventId: event.id,
        eventType: event.type,
        consumerKey: reg.consumerKey,
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }
}
