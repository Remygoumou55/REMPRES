"use client";

import dynamic from "next/dynamic";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { SalesAnalytics } from "@/lib/server/sales-analytics";
import type { TopListItem } from "@/components/vente/stats/TopList";

const chartSkeleton = <Skeleton className="h-64 w-full rounded-2xl" />;

const RevenueBarChart = dynamic(
  () => import("@/components/vente/stats/RevenueBarChart").then((m) => m.RevenueBarChart),
  { ssr: false, loading: () => chartSkeleton },
);

const CategoryPieChart = dynamic(
  () => import("@/components/vente/stats/CategoryPieChart").then((m) => m.CategoryPieChart),
  { ssr: false, loading: () => chartSkeleton },
);

const TopList = dynamic(
  () => import("@/components/vente/stats/TopList").then((m) => m.TopList),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full rounded-2xl" /> },
);

const VenteStatsInsights = dynamic(
  () => import("@/components/vente/stats/VenteStatsInsights").then((m) => m.VenteStatsInsights),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-2xl" /> },
);

type Props = {
  analytics: SalesAnalytics;
  topProductItems: TopListItem[];
  topClientItems: TopListItem[];
};

export function VenteStatistiquesCharts({
  analytics,
  topProductItems,
  topClientItems,
}: Props) {
  return (
    <>
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
    </>
  );
}
