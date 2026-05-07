export type AuditSeverity = "low" | "medium" | "high" | "critical";

export type AuditEventType =
  | "USER_INVITED"
  | "USER_ROLE_CHANGED"
  | "MANAGER_REPLACED"
  | "CLIENT_DELETED"
  | "PRODUCT_ARCHIVED"
  | "SALE_DELETED"
  | "EXPENSE_UPDATED"
  | "BULK_OPERATION"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "PASSWORD_RESET"
  | "APPROVAL_GRANTED"
  | "APPROVAL_REJECTED";

export type AuditTarget = {
  table: string;
  id?: string | null;
};

export type AuditContext = {
  actorUserId: string;
  actorRole?: string | null;
  departmentKey?: string | null;
  sessionId?: string | null;
  requestId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

export type AuditEntryInput = {
  eventType: AuditEventType;
  severity: AuditSeverity;
  target: AuditTarget;
  context: AuditContext;
  details?: Record<string, unknown>;
  approval?: {
    required: boolean;
    status: "granted" | "rejected" | "not_required";
    policy?: string;
  };
};
