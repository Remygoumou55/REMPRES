import type { GovernanceApprovalRequest } from "@/lib/governance/approvals/types";
import { ApprovalStatusBadge } from "./ApprovalStatusBadge";
import { ApprovalTimeline } from "./ApprovalTimeline";
import { getApprovalCardMeta, getApprovalCardScope, getApprovalCardTitle } from "./approval-display";

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
        <h3 className="text-sm font-semibold text-darktext">{getApprovalCardTitle(request)}</h3>
        <ApprovalStatusBadge status={request.status} />
      </div>
      <p className="mt-1 text-xs font-medium text-gray-700">{getApprovalCardScope(request)}</p>
      <p className="mt-0.5 text-xs text-gray-500">{getApprovalCardMeta(request)}</p>
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
