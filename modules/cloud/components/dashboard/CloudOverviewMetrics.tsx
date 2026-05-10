import type { CloudOperationalOverview } from "@/modules/cloud/types/domain";

export function CloudOverviewMetrics({ overview }: { overview: CloudOperationalOverview }) {
  const cards = [
    { label: "Régions catalogue", value: overview.regionsCount },
    { label: "Profils tenant/région", value: overview.tenantRegionProfilesCount },
    { label: "Services edge", value: overview.edgeServicesCount },
    { label: "Politiques de charge", value: overview.workloadPoliciesCount },
    { label: "Jobs cloud en attente", value: overview.cloudPendingJobs },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-sky-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{c.label}</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
