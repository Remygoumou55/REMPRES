import { GovernanceKpiCard } from "./GovernanceKpiCard";

export function GovernanceSummaryGrid({
  salesToday,
  salesMonth,
  unresolvedAlerts,
  pendingApprovals,
  healthScore,
}: {
  salesToday: number;
  salesMonth: number;
  unresolvedAlerts: number;
  pendingApprovals: number;
  healthScore: number;
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <GovernanceKpiCard label="Sales today" value={String(salesToday)} />
      <GovernanceKpiCard label="Sales month" value={String(salesMonth)} />
      <GovernanceKpiCard label="Unresolved alerts" value={String(unresolvedAlerts)} />
      <GovernanceKpiCard label="Pending approvals" value={String(pendingApprovals)} />
      <GovernanceKpiCard label="Enterprise health" value={`${healthScore}/100`} hint="Composite governance score" />
    </section>
  );
}
