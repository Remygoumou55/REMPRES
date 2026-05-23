/**
 * Publishers d'intégration — options perf (audit métier déjà persisté ailleurs).
 */

import { publishOfficialErpEvent } from "@/lib/erp-core/events/event-bus";
import type { PublishErpEventInput } from "@/lib/erp-core/events/event-bus";
import type { OfficialErpEventType } from "@/lib/erp-core/events/event-taxonomy";

/** Évite double écriture audit + bloque la mutation sur dispatch handlers. */
export const INTEGRATION_EVENT_PUBLISH_DEFAULTS = {
  persistAudit: false,
  awaitDispatch: false,
} as const satisfies Partial<PublishErpEventInput>;

export async function publishIntegrationOfficialEvent(
  type: OfficialErpEventType,
  input: Omit<PublishErpEventInput, "type">,
) {
  return publishOfficialErpEvent(type, {
    ...INTEGRATION_EVENT_PUBLISH_DEFAULTS,
    ...input,
  });
}
