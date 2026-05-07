import { EnterpriseOverviewCard } from "./EnterpriseOverviewCard";

type EnterpriseMetricsSectionProps = {
  clientsTotal: number;
  salesToday: number;
  salesMonth: number;
  netSaleAmountMonth: number;
};

export function EnterpriseMetricsSection({
  clientsTotal,
  salesToday,
  salesMonth,
  netSaleAmountMonth,
}: EnterpriseMetricsSectionProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <EnterpriseOverviewCard
        title="Clients actifs"
        value={String(clientsTotal)}
        subtitle="Base entreprise consolidee"
      />
      <EnterpriseOverviewCard
        title="Ventes du jour"
        value={String(salesToday)}
        subtitle="Flux operationnel journalier"
      />
      <EnterpriseOverviewCard
        title="Transactions mois"
        value={String(salesMonth)}
        subtitle="Volume mensuel de ventes"
      />
      <EnterpriseOverviewCard
        title="Net mensuel"
        value={new Intl.NumberFormat("fr-FR").format(netSaleAmountMonth)}
        subtitle="Montant net consolide (GNF)"
      />
    </section>
  );
}
