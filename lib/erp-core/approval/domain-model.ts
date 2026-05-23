/**
 * B3.1 — Domain model approval ERP (contrats normatifs).
 */

import { ERP_APPROVAL_ENGINE_VERSION } from "@/lib/erp-core/approval/version";

export const ERP_APPROVAL_ENGINE_SOURCE = ERP_APPROVAL_ENGINE_VERSION;

/** Statuts logiques (couche applicative). */
export const ERP_APPROVAL_STATUSES = [
  "draft",
  "submitted",
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "expired",
] as const;

export type ErpApprovalStatus = (typeof ERP_APPROVAL_STATUSES)[number];

/** Statuts persistés `approval_requests` (036). */
export const ERP_APPROVAL_DB_STATUSES = ["pending", "approved", "rejected", "expired"] as const;

export type ErpApprovalDbStatus = (typeof ERP_APPROVAL_DB_STATUSES)[number];

export type ErpApprovalActor = {
  userId: string;
  roleKey: string | null;
  departmentKey: string | null;
};

export type ErpApprovalScope = {
  departmentKey: string;
  actionType: string;
  entityType: string;
  entityId: string;
};

export type ErpApprovalRule = {
  mutationAction: string;
  policy: ErpApprovalPolicyKind;
  required: boolean;
  approverRoleKeys?: readonly string[];
  amountThresholdGnf?: number | null;
  description: string;
};

export type ErpApprovalPolicyKind = "auto" | "governance_required" | "threshold_required";

export type ErpApprovalPolicy = {
  version: typeof ERP_APPROVAL_ENGINE_SOURCE;
  required: boolean;
  kind: ErpApprovalPolicyKind;
  reason: string;
  rule?: ErpApprovalRule;
};

export type ErpApprovalRequest = {
  id: string;
  scope: ErpApprovalScope;
  status: ErpApprovalDbStatus;
  logicalStatus: ErpApprovalStatus;
  requestedBy: string;
  requestedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  payloadSnapshot: Record<string, unknown>;
};

export type ErpApprovalDecision = {
  required: boolean;
  granted: boolean;
  policy: ErpApprovalPolicy;
  requestId?: string | null;
  reason: string;
};
