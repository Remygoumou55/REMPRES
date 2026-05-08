import type { GovernanceAlertSeverity } from "@/lib/governance/alerts/types";

const SEVERITY_STYLES: Record<GovernanceAlertSeverity, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-orange-50 text-orange-700",
  critical: "bg-red-50 text-red-700",
};

export function AlertSeverityBadge({
  severity,
  label,
}: {
  severity: GovernanceAlertSeverity;
  label: string;
}) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLES[severity]}`}>
      {label}
    </span>
  );
}
