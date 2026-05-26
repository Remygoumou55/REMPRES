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
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-darktext">Tout est à jour !</p>
        <p className="mt-2 text-sm text-gray-500">
          Aucune demande en attente pour le moment. Les nouvelles demandes apparaîtront ici automatiquement.
        </p>
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
