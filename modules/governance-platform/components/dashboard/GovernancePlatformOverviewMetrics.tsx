import type { GovernancePlatformOverview } from "@/modules/governance-platform/types/domain";

export function GovernancePlatformOverviewMetrics({
  overview,
}: {
  overview: GovernancePlatformOverview;
}) {
  const cards = [
    { label: "ADR", value: overview.adrCount },
    { label: "Sujets board", value: overview.boardTopicsCount },
    { label: "Standards", value: overview.standardsCount },
    { label: "Dette technique", value: overview.technicalDebtCount },
    { label: "Snapshots maturité", value: overview.maturitySnapshotsCount },
    { label: "Jobs en attente", value: overview.governancePlatformPendingJobs },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{c.label}</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
