import type { PlatformOperationalOverview } from "@/modules/platform/types/domain";

export function PlatformOverviewMetrics({
  overview,
}: {
  overview: PlatformOperationalOverview;
}) {
  const cards = [
    { label: "Catalogue listé", value: overview.catalogListed },
    { label: "Installations actives", value: overview.installationsActive },
    { label: "Connexions partenaires", value: overview.partnerConnections },
    { label: "Événements outbox 24h", value: overview.externalEvents24h },
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
