import type { GovernanceAlert } from "@/lib/governance/alerts/types";
import { AlertSeverityBadge } from "./AlertSeverityBadge";
import { AlertStatusBadge } from "./AlertStatusBadge";
import { AlertTimeline } from "./AlertTimeline";

export function GovernanceAlertCard({
  alert,
  actions,
}: {
  alert: GovernanceAlert;
  actions?: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">{alert.title}</h3>
        <div className="flex items-center gap-1">
          <AlertSeverityBadge severity={alert.severity} />
          <AlertStatusBadge status={alert.status} />
        </div>
      </div>
      <p className="mt-1 text-sm text-gray-600">{alert.description}</p>
      <p className="mt-1 text-xs text-gray-500">
        Dept: {alert.departmentKey ?? "GLOBAL"} · Type: {alert.type}
      </p>
      <div className="mt-2">
        <AlertTimeline createdAt={alert.createdAt} resolvedAt={alert.resolvedAt} />
      </div>
      {actions ? <div className="mt-3">{actions}</div> : null}
    </article>
  );
}
