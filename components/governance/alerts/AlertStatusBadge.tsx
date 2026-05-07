import type { GovernanceAlertStatus } from "@/lib/governance/alerts/types";

const STATUS_STYLES: Record<GovernanceAlertStatus, string> = {
  unread: "bg-blue-50 text-blue-700",
  acknowledged: "bg-amber-50 text-amber-700",
  resolved: "bg-emerald-50 text-emerald-700",
};

export function AlertStatusBadge({ status }: { status: GovernanceAlertStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}
