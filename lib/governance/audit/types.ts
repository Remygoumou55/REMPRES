export type GovernanceAuditCategory =
  | "authentication"
  | "approval"
  | "mutation"
  | "archive"
  | "invitation"
  | "governance"
  | "event"
  | "security"
  | "system";

export type GovernanceAuditSeverity = "informational" | "warning" | "critical" | "security";

export type GovernanceAuditEvent = {
  id: string;
  category: GovernanceAuditCategory;
  severity: GovernanceAuditSeverity;
  departmentKey: string | null;
  actorUserId: string | null;
  actorRole: string | null;
  actionType: string;
  entityType: string | null;
  entityId: string | null;
  beforeSnapshot: Record<string, unknown> | null;
  afterSnapshot: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};
