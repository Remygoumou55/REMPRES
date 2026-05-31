"use client";

import { ShoppingBag, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";

type Props = {
  totalRevenueLabel: string;
  totalSales: number;
  averageBasketLabel: string;
  newClientsThisMonth: number;
  hasData: boolean;
};

export function VenteStatistiquesKpis({
  totalRevenueLabel,
  totalSales,
  averageBasketLabel,
  newClientsThisMonth,
  hasData,
}: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Total CA (période)"
        value={totalRevenueLabel}
        icon={TrendingUp}
        color="green"
        isEmpty={!hasData}
      />
      <KpiCard
        title="Nombre de ventes"
        value={totalSales}
        icon={ShoppingBag}
        color="blue"
        isEmpty={!hasData}
      />
      <KpiCard
        title="Panier moyen"
        value={averageBasketLabel}
        icon={ShoppingCart}
        color="purple"
        isEmpty={!hasData}
      />
      <KpiCard
        title="Nouveaux clients"
        value={newClientsThisMonth}
        subtitle="Ce mois"
        icon={Users}
        color="teal"
      />
    </div>
  );
}
