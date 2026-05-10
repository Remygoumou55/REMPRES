import type { ResilienceOperationalOverview } from "@/modules/resilience/types/domain";

export function ResilienceOverviewMetrics({ overview }: { overview: ResilienceOperationalOverview }) {
  const cards = [
    { label: "Scénarios", value: overview.scenariosCount },
    { label: "Runs validation", value: overview.validationRunsCount },
    { label: "Snapshots métriques", value: overview.metricSnapshotsCount },
    { label: "Jobs en attente", value: overview.resiliencePendingJobs },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{c.label}</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
