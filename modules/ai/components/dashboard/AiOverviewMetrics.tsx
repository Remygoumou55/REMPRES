import type { AiOperationalOverview } from "@/modules/ai/server/services/ai-overview";

export function AiOverviewMetrics({ overview }: { overview: AiOperationalOverview }) {
  const cards = [
    { label: "Insights 24h", value: overview.insights24h },
    { label: "Reco. en attente", value: overview.recommendationsPending },
    { label: "Forecasting 24h", value: overview.forecastArtifacts24h },
    { label: "Runs pipeline 24h", value: overview.pipelineRuns24h },
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
