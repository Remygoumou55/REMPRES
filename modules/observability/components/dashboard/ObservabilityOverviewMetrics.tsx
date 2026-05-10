import type { ObservabilityOperationalOverview } from "@/modules/observability/server/services/observability-overview";

export function ObservabilityOverviewMetrics({
  overview,
}: {
  overview: ObservabilityOperationalOverview;
}) {
  const scoreLabel =
    overview.latestHealthScore == null ? "—" : String(overview.latestHealthScore);

  const cards = [
    { label: "Score santé (global)", value: scoreLabel },
    { label: "Incidents actifs", value: overview.openIncidents },
    { label: "Anomalies ouvertes", value: overview.openAnomalies },
    { label: "Spans trace 24h", value: overview.traceEvents24h },
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
