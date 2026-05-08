import type { GovernanceAlert } from "@/lib/governance/alerts/types";
import { GovernanceAlertCard } from "./GovernanceAlertCard";

export function GovernanceAlertTable({
  alerts,
  renderActions,
  emptyLabel,
  labels,
}: {
  alerts: GovernanceAlert[];
  renderActions?: (alert: GovernanceAlert) => React.ReactNode;
  emptyLabel: string;
  labels: {
    department: string;
    global: string;
    type: string;
    resolvedTitleByKey: (key: string, fallback: string) => string;
    severityLabel: (severity: GovernanceAlert["severity"]) => string;
    statusLabel: (status: GovernanceAlert["lifecycleStatus"]) => string;
  };
}) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <GovernanceAlertCard
          key={alert.id}
          alert={alert}
          labels={labels}
          actions={renderActions ? renderActions(alert) : null}
        />
      ))}
    </div>
  );
}
