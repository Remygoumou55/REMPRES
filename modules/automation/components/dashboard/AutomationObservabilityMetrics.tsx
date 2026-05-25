import type { AutomationObservabilityMetrics } from "@/modules/automation/server/services/automation-observability-metrics";

export function AutomationObservabilityMetricsPanel({ metrics }: { metrics: AutomationObservabilityMetrics }) {
  const cards = [
    { label: "Exécutions 24h", value: metrics.executions24h },
    { label: "Succès", value: metrics.successCount24h },
    { label: "Échecs", value: metrics.failureCount24h },
    { label: "Taux succès", value: `${metrics.successRatePct}%` },
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
