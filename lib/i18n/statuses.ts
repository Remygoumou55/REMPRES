import type { ApprovalRequestStatus } from "@/lib/governance/approvals/types";
import type { GovernanceAlertSeverity, GovernanceAlertStatus } from "@/lib/governance/alerts/types";
import type { GovernanceAuditSeverity } from "@/lib/governance/audit/types";

export const APPROVAL_STATUSES: readonly ApprovalRequestStatus[] = [
  "pending",
  "approved",
  "rejected",
  "expired",
] as const;

export const ALERT_STATUSES: readonly GovernanceAlertStatus[] = [
  "unread",
  "acknowledged",
  "resolved",
] as const;

export const ALERT_SEVERITIES: readonly GovernanceAlertSeverity[] = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export const AUDIT_SEVERITIES: readonly GovernanceAuditSeverity[] = [
  "informational",
  "warning",
  "critical",
  "security",
] as const;

export type PaymentStatus = "pending" | "partial" | "paid" | "overdue" | "cancelled";

export function statusTranslationKey(status: string): string {
  return `status.${status}`;
}

export function severityTranslationKey(severity: string): string {
  return `severity.${severity}`;
}

export function trendTranslationKey(trend: "up" | "down" | "stable"): string {
  return `trend.${trend}`;
}
