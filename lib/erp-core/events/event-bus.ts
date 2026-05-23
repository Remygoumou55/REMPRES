/**
 * B3.2 — Bus central ERP : publish → trace → dispatch.
 */

import type { ErpEventEnvelope, ErpEventFamily, ErpEventPayload } from "@/lib/erp-core/events/event-contracts";
import { ERP_EVENT_BUS_VERSION } from "@/lib/erp-core/events/version";
import {
  assertValidEventType,
  isOfficialEventType,
  resolveOfficialEventMeta,
  type OfficialErpEventType,
} from "@/lib/erp-core/events/event-taxonomy";
import { assertCanPublishEvent } from "@/lib/erp-core/events/event-security";
import { dispatchErpEvent } from "@/lib/erp-core/events/event-dispatcher";
import { appendEventTrace, persistEventBusAudit } from "@/lib/erp-core/events/event-traceability";

export type PublishErpEventInput = {
  type: string;
  actorUserId?: string | null;
  departmentKey?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload?: ErpEventPayload;
  correlationId?: string | null;
  causationId?: string | null;
  family?: ErpEventFamily;
  sensitivity?: ErpEventEnvelope["sensitivity"];
  persistAudit?: boolean;
};

export async function publishErpEvent(input: PublishErpEventInput): Promise<ErpEventEnvelope> {
  assertValidEventType(input.type);

  const officialMeta = isOfficialEventType(input.type)
    ? resolveOfficialEventMeta(input.type)
    : null;

  const event: ErpEventEnvelope = {
    id: crypto.randomUUID(),
    type: input.type,
    version: ERP_EVENT_BUS_VERSION,
    family: input.family ?? officialMeta?.family ?? "runtime",
    sensitivity: input.sensitivity ?? officialMeta?.sensitivity ?? "internal",
    occurredAt: new Date().toISOString(),
    actorUserId: input.actorUserId ?? null,
    departmentKey: input.departmentKey ?? null,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    payload: input.payload ?? {},
    correlationId: input.correlationId ?? null,
    causationId: input.causationId ?? null,
  };

  assertCanPublishEvent(
    { actorUserId: event.actorUserId, departmentKey: event.departmentKey },
    event,
  );

  appendEventTrace({
    phase: "published",
    eventId: event.id,
    eventType: event.type,
  });

  if (input.persistAudit !== false) {
    await persistEventBusAudit(event);
  }

  await dispatchErpEvent(event);

  return event;
}

export async function publishOfficialErpEvent(
  type: OfficialErpEventType,
  input: Omit<PublishErpEventInput, "type">,
): Promise<ErpEventEnvelope> {
  return publishErpEvent({ ...input, type });
}
