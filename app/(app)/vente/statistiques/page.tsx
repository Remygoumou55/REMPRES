import { redirect } from "next/navigation";
import { ShoppingBag, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getClientsPermissions } from "@/lib/server/permissions";
import { EMPTY_SALES_ANALYTICS, getSalesAnalytics } from "@/lib/server/sales-analytics";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { VenteStatistiquesCharts } from "@/components/vente/stats/VenteStatistiquesCharts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Statistiques Vente" };

function formatGnf(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

export default async function VenteStatistiquesPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const permissions = await getClientsPermissions(user.id);
  if (!permissions.canRead) redirect("/access-denied");

  const analytics = await getSalesAnalytics({ months: 12, limit: 5 });
  const hasData = analytics.totalSales > 0;

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

      {!hasData ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Aucune vente validée sur les 12 derniers mois. Les graphiques affichent des
          valeurs à zéro jusqu&apos;à la première vente enregistrée.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total CA (période)"
          value={formatGnf(analytics.totalRevenue)}
          icon={TrendingUp}
          color="green"
          isEmpty={!hasData}
        />
        <KpiCard
          title="Nombre de ventes"
          value={analytics.totalSales}
          icon={ShoppingBag}
          color="blue"
          isEmpty={!hasData}
        />
        <KpiCard
          title="Panier moyen"
          value={formatGnf(analytics.averageBasket)}
          icon={ShoppingCart}
          color="purple"
          isEmpty={!hasData}
        />
        <KpiCard
          title="Nouveaux clients"
          value={analytics.newClientsThisMonth}
          subtitle="Ce mois"
          icon={Users}
          color="teal"
        />
      </div>

      <VenteStatistiquesCharts
        analytics={
          analytics.monthlyRevenue.length > 0 ? analytics : EMPTY_SALES_ANALYTICS
        }
        topProductItems={topProductItems}
        topClientItems={topClientItems}
      />
    </div>
  );
}
