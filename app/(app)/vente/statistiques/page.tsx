import { redirect } from "next/navigation";
import { BarChart3, ShoppingBag, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { getSalesAnalytics } from "@/lib/server/sales-analytics";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueBarChart } from "@/components/vente/stats/RevenueBarChart";
import { CategoryPieChart } from "@/components/vente/stats/CategoryPieChart";
import { TopList } from "@/components/vente/stats/TopList";
import { VenteStatsInsights } from "@/components/vente/stats/VenteStatsInsights";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Statistiques Vente" };

function formatGnf(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

export default async function VenteStatistiquesPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const permissions = await getModulePermissions(user.id, ["vente", "produits", "clients"]);
  if (!permissions.canRead) redirect("/access-denied");

  const analytics = await getSalesAnalytics({ months: 12, limit: 5 });

  const topProductItems = analytics.topProducts.map((p) => ({
    id: p.product_id,
    name: p.product_name,
    subtitle: p.category,
    value: p.total_revenue_gnf,
    count: p.sale_count,
    maxValue: analytics.topProducts[0]?.total_revenue_gnf ?? 1,
  }));

  const topClientItems = analytics.topClients.map((c) => ({
    id: c.client_id,
    name: c.client_name,
    subtitle: c.company,
    value: c.total_purchases_gnf,
    count: c.purchase_count,
    maxValue: analytics.topClients[0]?.total_purchases_gnf ?? 1,
  }));

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Statistiques Vente"
        subtitle="Analyse des 12 derniers mois"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total CA (période)"
          value={formatGnf(analytics.totalRevenue)}
          icon={TrendingUp}
          color="green"
          isEmpty={analytics.totalSales === 0}
        />
        <KpiCard
          title="Nombre de ventes"
          value={analytics.totalSales}
          icon={ShoppingBag}
          color="blue"
          isEmpty={analytics.totalSales === 0}
        />
        <KpiCard
          title="Panier moyen"
          value={formatGnf(analytics.averageBasket)}
          icon={ShoppingCart}
          color="purple"
          isEmpty={analytics.totalSales === 0}
        />
        <KpiCard
          title="Nouveaux clients"
          value={analytics.newClientsThisMonth}
          subtitle="Ce mois"
          icon={Users}
          color="teal"
        />
      </div>

      <section className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-darktext">Évolution du CA</h2>
        </div>
        <RevenueBarChart data={analytics.monthlyRevenue} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopList
          title="Top 5 Produits"
          items={topProductItems}
          valueLabel="Chiffre d'affaires"
          countLabel="ventes"
          emptyText="Aucun produit vendu sur la période."
        />
        <TopList
          title="Top 5 Clients"
          items={topClientItems}
          valueLabel="Volume d'achats"
          countLabel="achats"
          emptyText="Aucun client avec achats sur la période."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-darktext">
            Répartition par catégorie
          </h3>
          <p className="mb-3 text-xs text-gray-500">
            Répartition par unité produit (catalogue RemPres).
          </p>
          <CategoryPieChart data={analytics.categoryRevenue} />
        </section>
        <VenteStatsInsights
          returningClientsRate={analytics.returningClientsRate}
          averageBasket={analytics.averageBasket}
          highestSaleGnf={analytics.highestSaleGnf}
          topCategory={analytics.topCategory}
          leadConversionRate={analytics.leadConversionRate}
        />
      </div>
    </div>
  );
}
