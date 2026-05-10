import type { EcosystemOperationalOverview } from "@/modules/ecosystem/types/domain";

export function EcosystemOverviewMetrics({
  overview,
}: {
  overview: EcosystemOperationalOverview;
}) {
  const cards = [
    { label: "Partenaires actifs", value: overview.partnersActive },
    { label: "Liens tenant↔partenaire", value: overview.tenantPartnerLinks },
    { label: "Certifications « certified »", value: overview.certificationsCertified },
    { label: "Événements fédération 24h", value: overview.federationEvents24h },
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
