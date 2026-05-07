import { GovernanceDashboardCard } from "./GovernanceDashboardCard";

type KPIOverviewCardProps = {
  clientsTotal: number;
  salesToday: number;
  salesMonth: number;
};

export function KPIOverviewCard({
  clientsTotal,
  salesToday,
  salesMonth,
}: KPIOverviewCardProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <GovernanceDashboardCard
        title="Clients actifs"
        value={String(clientsTotal)}
        subtitle="Base clients globale ERP"
      />
      <GovernanceDashboardCard
        title="Ventes aujourd'hui"
        value={String(salesToday)}
        subtitle="Volume transactionnel journalier"
      />
      <GovernanceDashboardCard
        title="Transactions du mois"
        value={String(salesMonth)}
        subtitle="Cadence de production mensuelle"
      />
    </section>
  );
}
