import type { ComplianceOperationalOverview } from "@/modules/compliance/server/services/compliance-overview";

export function ComplianceOverviewMetrics({
  overview,
}: {
  overview: ComplianceOperationalOverview;
}) {
  const cards = [
    { label: "Périodes définies", value: overview.accountingPeriods },
    { label: "Verrous fiscaux actifs", value: overview.fiscalLocksActive },
    { label: "Signaux risque ouverts", value: overview.openRiskSignals },
    { label: "Snapshots 24h", value: overview.snapshots24h },
    { label: "Politiques rétention actives", value: overview.retentionPoliciesActive },
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
