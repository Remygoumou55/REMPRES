export type GovernanceAlertSeverity = "low" | "medium" | "high" | "critical";
export type GovernanceAlertStatus = "unread" | "acknowledged" | "resolved";
export type GovernanceAlertLifecycleStatus = GovernanceAlertStatus | "archived";
export type GovernanceAlertCategory =
  | "SECURITY"
  | "GOVERNANCE"
  | "OPERATIONAL"
  | "SYSTEM";
export type GovernanceAlertEscalation = "manager" | "manager_and_dg" | "dg_only";

export type GovernanceAlert = {
  id: string;
  type: string;
  severity: GovernanceAlertSeverity;
  category: GovernanceAlertCategory;
  escalation: GovernanceAlertEscalation;
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
  lifecycleStatus: GovernanceAlertLifecycleStatus;
};
