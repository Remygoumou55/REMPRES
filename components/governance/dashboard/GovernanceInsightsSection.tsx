import { GovernanceMetricsCard } from "./GovernanceMetricsCard";

type GovernanceInsightsSectionProps = {
  activityEvents24h: number;
  activeUsers: number;
};

export function GovernanceInsightsSection({
  activityEvents24h,
  activeUsers,
}: GovernanceInsightsSectionProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Insights gouvernance</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <GovernanceMetricsCard label="Evenements critiques (24h)" value={String(activityEvents24h)} />
        <GovernanceMetricsCard label="Utilisateurs actifs" value={String(activeUsers)} />
      </div>
    </section>
  );
}
