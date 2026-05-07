import type { AuditEventType } from "@/lib/audit/audit-types";

const SENSITIVE_EVENTS = new Set<AuditEventType>([
  "SALE_DELETED",
  "BULK_OPERATION",
  "CLIENT_DELETED",
  "PRODUCT_ARCHIVED",
  "EXPENSE_UPDATED",
  "USER_ROLE_CHANGED",
  "MANAGER_REPLACED",
]);

export function isSensitiveAction(eventType: AuditEventType): boolean {
  return SENSITIVE_EVENTS.has(eventType);
}
