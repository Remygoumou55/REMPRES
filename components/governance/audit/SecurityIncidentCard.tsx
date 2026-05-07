import type { GovernanceAuditEvent } from "@/lib/governance/audit/types";

export function SecurityIncidentCard({ event }: { event: GovernanceAuditEvent }) {
  return (
    <article className="rounded-xl border border-violet-200 bg-violet-50 p-3">
      <p className="text-xs font-semibold text-violet-800">{event.actionType}</p>
      <p className="mt-1 text-xs text-violet-700">
        Dept: {event.departmentKey ?? "GLOBAL"} · {new Date(event.createdAt).toLocaleString("fr-FR")}
      </p>
    </article>
  );
}
