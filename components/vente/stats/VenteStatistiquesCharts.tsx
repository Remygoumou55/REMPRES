"use client";

import dynamic from "next/dynamic";
import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { SalesAnalytics } from "@/lib/server/sales-analytics";
import type { TopListItem } from "@/components/vente/stats/TopList";
import { logError } from "@/lib/logger";

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

type VenteStatsErrorBoundaryProps = {
  children: ReactNode;
};

type VenteStatsErrorBoundaryState = {
  hasError: boolean;
};

class VenteStatsErrorBoundary extends Component<
  VenteStatsErrorBoundaryProps,
  VenteStatsErrorBoundaryState
> {
  state: VenteStatsErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): VenteStatsErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logError("vente-stats", "charts runtime error", {
      error: error.message,
      stack: info.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="card p-5">
          <h2 className="text-base font-semibold text-darktext">Statistiques vente</h2>
          <p className="mt-2 text-sm text-gray-600">
            Impossible d&apos;afficher les graphiques pour le moment. Les KPI restent disponibles.
          </p>
        </section>
      );
    }
    return this.props.children;
  }
}

export function VenteStatistiquesCharts({
  analytics,
  topProductItems,
  topClientItems,
}: Props) {
  return (
    <VenteStatsErrorBoundary>
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
    </VenteStatsErrorBoundary>
  );
}
