/**
 * B3.1 — Lifecycle approval ERP (gouvernance, pas workflow métier).
 */

import type { ErpApprovalDbStatus, ErpApprovalStatus } from "@/lib/erp-core/approval/domain-model";

export const ERP_APPROVAL_TERMINAL_STATUSES: readonly ErpApprovalStatus[] = [
  "approved",
  "rejected",
  "cancelled",
  "expired",
];

const ALLOWED_TRANSITIONS: Partial<Record<ErpApprovalStatus, readonly ErpApprovalStatus[]>> = {
  draft: ["submitted", "cancelled"],
  submitted: ["pending", "cancelled"],
  pending: ["approved", "rejected", "expired", "cancelled"],
  approved: [],
  rejected: [],
  cancelled: [],
  expired: [],
};

export function assertApprovalStatusTransition(
  from: ErpApprovalStatus,
  to: ErpApprovalStatus,
): void {
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(`erp_approval:invalid_transition:${from}->${to}`);
  }
}

/** Mapping logique → statut DB (036). */
export function toDbApprovalStatus(status: ErpApprovalStatus): ErpApprovalDbStatus {
  switch (status) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "expired":
    case "cancelled":
      return "expired";
    case "draft":
    case "submitted":
    case "pending":
    default:
      return "pending";
  }
}

export function logicalStatusFromDb(status: ErpApprovalDbStatus): ErpApprovalStatus {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "expired") return "expired";
  return "pending";
}
