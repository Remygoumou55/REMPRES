import type { Json } from "@/types/database.types";
import { insertActivityLog } from "@/lib/server/insert-activity-log";
import { logError } from "@/lib/logger";
import { AUDIT_DEFAULT_SEVERITY } from "@/lib/audit/audit-events";
import type { AuditEntryInput } from "@/lib/audit/audit-types";

function toJsonObject(input: Record<string, unknown>): Json {
  return input as Json;
}

/**
 * Audit append-only: écriture centralisée vers activity_logs.
 * Aucun update/delete n'est exposé ici pour préserver l'immutabilité historique.
 */
export async function logAuditEvent(input: AuditEntryInput): Promise<void> {
  const metadata = toJsonObject({
    event_type: input.eventType,
    severity: input.severity ?? AUDIT_DEFAULT_SEVERITY[input.eventType],
    actor_role: input.context.actorRole ?? null,
    department_key: input.context.departmentKey ?? null,
    session_id: input.context.sessionId ?? null,
    request_id: input.context.requestId ?? null,
    ip: input.context.ip ?? null,
    user_agent: input.context.userAgent ?? null,
    approval: input.approval ?? { required: false, status: "not_required" },
    details: input.details ?? {},
    immutable: true,
  });

  await insertActivityLog({
    actorUserId: input.context.actorUserId,
    moduleKey: "audit",
    actionKey: input.eventType.toLowerCase(),
    targetTable: input.target.table,
    targetId: input.target.id ?? null,
    metadata,
  });
}

export async function tryLogAuditEvent(input: AuditEntryInput): Promise<void> {
  try {
    await logAuditEvent(input);
  } catch (error) {
    logError("AUDIT_LOGGER", error, {
      eventType: input.eventType,
      target: input.target.table,
      targetId: input.target.id ?? null,
    });
  }
}
