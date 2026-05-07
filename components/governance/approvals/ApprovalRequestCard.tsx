import type { GovernanceApprovalRequest } from "@/lib/governance/approvals/types";
import { ApprovalStatusBadge } from "./ApprovalStatusBadge";
import { ApprovalTimeline } from "./ApprovalTimeline";

export function ApprovalRequestCard({
  request,
  actions,
}: {
  request: GovernanceApprovalRequest;
  actions?: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">
          {request.actionType} · {request.entityType}:{request.entityId}
        </h3>
        <ApprovalStatusBadge status={request.status} />
      </div>
      <p className="mt-1 text-xs text-gray-600">
        Departement: {request.departmentKey} · Requester: {request.requestedBy}
      </p>
      <div className="mt-2">
        <ApprovalTimeline
          requestedAt={request.requestedAt}
          approvedAt={request.approvedAt}
          rejectedAt={request.rejectedAt}
        />
      </div>
      {actions ? <div className="mt-3">{actions}</div> : null}
    </article>
  );
}
