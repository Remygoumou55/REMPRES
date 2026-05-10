import type { MultitenantOperationalOverview } from "@/modules/multitenant/types/domain";

export function MultitenantOverviewMetrics({
  overview,
}: {
  overview: MultitenantOperationalOverview;
}) {
  const cards = [
    { label: "Tenants visibles", value: overview.tenantsVisible },
    { label: "Mes adhésions", value: overview.membershipsForUser },
    { label: "Lignes quotas", value: overview.quotasRows },
    { label: "Jobs multitenant en attente", value: overview.multitenantPendingJobs },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{c.label}</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
