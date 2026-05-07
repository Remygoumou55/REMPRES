import type { GovernanceAlert } from "@/lib/governance/alerts/types";
import { GovernanceAlertCard } from "./GovernanceAlertCard";

export function GovernanceAlertTable({
  alerts,
  renderActions,
}: {
  alerts: GovernanceAlert[];
  renderActions?: (alert: GovernanceAlert) => React.ReactNode;
}) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm">
        Aucune alerte gouvernance.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <GovernanceAlertCard
          key={alert.id}
          alert={alert}
          actions={renderActions ? renderActions(alert) : null}
        />
      ))}
    </div>
  );
}
