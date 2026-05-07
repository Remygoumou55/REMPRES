import type { AuditEventType } from "@/lib/audit/audit-types";

export type ApprovalPolicy = "soft_auto" | "governance_required";

export type ApprovalDecision = {
  required: boolean;
  granted: boolean;
  policy: ApprovalPolicy;
  reason: string;
};

export type ApprovalContext = {
  eventType: AuditEventType;
  actorUserId: string;
  actorRole?: string | null;
  departmentKey?: string | null;
  metadata?: Record<string, unknown>;
};
