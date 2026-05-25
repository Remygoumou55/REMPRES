import type { PlatformObservabilityMetrics } from "@/modules/platform/server/services/platform-observability-metrics";

export function PlatformObservabilityMetricsPanel({ metrics }: { metrics: PlatformObservabilityMetrics }) {
  const cards = [
    { label: "APIs actives", value: metrics.apisActive },
    { label: "Connecteurs OK", value: metrics.connectorsConnected },
    { label: "Connecteurs dégradés", value: metrics.connectorsDegraded },
    { label: "Échecs connecteur 24h", value: metrics.connectorFailures24h },
    { label: "Invocations API 24h", value: metrics.apiInvocations24h },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{c.label}</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
