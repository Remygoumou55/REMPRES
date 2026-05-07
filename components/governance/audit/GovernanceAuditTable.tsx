import type { GovernanceAuditEvent } from "@/lib/governance/audit/types";
import { AuditSeverityBadge } from "./AuditSeverityBadge";
import { AuditActorCard } from "./AuditActorCard";
import { AuditTimeline } from "./AuditTimeline";

export function GovernanceAuditTable({ events }: { events: GovernanceAuditEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm">
        Aucun evenement d&apos;audit.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <article key={event.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {event.category} · {event.actionType}
            </h3>
            <AuditSeverityBadge severity={event.severity} />
          </div>
          <p className="mt-1 text-xs text-gray-600">
            Dept: {event.departmentKey ?? "GLOBAL"} · Entity: {event.entityType ?? "-"}:{event.entityId ?? "-"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <AuditActorCard actorUserId={event.actorUserId} actorRole={event.actorRole} />
            <AuditTimeline createdAt={event.createdAt} />
          </div>
        </article>
      ))}
    </div>
  );
}
