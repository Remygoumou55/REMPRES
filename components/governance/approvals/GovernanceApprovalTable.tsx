import type { GovernanceApprovalRequest } from "@/lib/governance/approvals/types";
import { ApprovalRequestCard } from "./ApprovalRequestCard";

export function GovernanceApprovalTable({
  requests,
  renderActions,
}: {
  requests: GovernanceApprovalRequest[];
  renderActions?: (request: GovernanceApprovalRequest) => React.ReactNode;
}) {
  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm">
        Aucune demande d&apos;approbation.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <ApprovalRequestCard
          key={request.id}
          request={request}
          actions={renderActions ? renderActions(request) : null}
        />
      ))}
    </div>
  );
}
