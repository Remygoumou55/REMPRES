export type GovernanceAlertSeverity = "low" | "medium" | "high" | "critical";
export type GovernanceAlertStatus = "unread" | "acknowledged" | "resolved";

export type GovernanceAlert = {
  id: string;
  type: string;
  severity: GovernanceAlertSeverity;
  departmentKey: string | null;
  title: string;
  description: string;
  entityType: string | null;
  entityId: string | null;
  triggeredBy: string | null;
  status: GovernanceAlertStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  resolvedAt: string | null;
};
