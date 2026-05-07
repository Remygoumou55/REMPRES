type ApprovalTimelineProps = {
  requestedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
};

function fmt(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("fr-FR");
}

export function ApprovalTimeline({ requestedAt, approvedAt, rejectedAt }: ApprovalTimelineProps) {
  return (
    <div className="text-xs text-gray-500">
      <p>Demande: {fmt(requestedAt)}</p>
      <p>Approuve: {fmt(approvedAt)}</p>
      <p>Rejete: {fmt(rejectedAt)}</p>
    </div>
  );
}
