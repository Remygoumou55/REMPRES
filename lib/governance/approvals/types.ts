export type ApprovalRequestStatus = "pending" | "approved" | "rejected" | "expired";

export type GovernanceApprovalRequest = {
  id: string;
  departmentKey: string;
  actionType: string;
  entityType: string;
  entityId: string;
  requestedBy: string;
  requestedAt: string;
  payloadSnapshot: Record<string, unknown>;
  reason: string | null;
  status: ApprovalRequestStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
};

export type ApprovalDecisionInput = {
  requestId: string;
  status: "approved" | "rejected" | "expired";
  approverUserId: string;
  rejectionReason?: string | null;
};
