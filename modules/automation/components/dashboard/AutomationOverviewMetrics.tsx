import type { AutomationOperationalOverview } from "@/modules/automation/server/services/automation-overview";

export function AutomationOverviewMetrics({ overview }: { overview: AutomationOperationalOverview }) {
  const cards = [
    { label: "Workflows actifs", value: overview.definitionsActive },
    { label: "Exécutions ouvertes", value: overview.runsOpen },
    { label: "Planifications dues", value: overview.schedulesDue },
    { label: "Événements 24h", value: overview.events24h },
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
