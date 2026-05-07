import type { GovernanceAlert } from "@/lib/governance/alerts/types";

export function CriticalAlertBanner({ alerts }: { alerts: GovernanceAlert[] }) {
  const criticalUnread = alerts.filter(
    (a) => a.severity === "critical" && (a.status === "unread" || a.status === "acknowledged"),
  );
  if (criticalUnread.length === 0) return null;

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <strong>{criticalUnread.length}</strong> alerte(s) critique(s) necessitent une attention immediate.
    </div>
  );
}
