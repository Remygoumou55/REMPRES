"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  UserPlus,
  ClipboardList,
  UserCog,
  Activity,
  BarChart2,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { useCurrencyStore } from "@/stores/currencyStore";
import { formatCurrency } from "@/utils/currency";
import type { DashboardKpis } from "@/lib/server/dashboard-kpis";
import { withCreateModalQuery } from "@/lib/routing/modal-query";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";
import { NAV_LABELS } from "@/lib/constants/nav-labels";
import { ROUTES } from "@/lib/constants/routes";

// Sub-components
import { ActivityTimeline } from "./components/ActivityTimeline";
import { QuickActionCard } from "./components/QuickActionCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DashboardClientProps = {
  userDisplayName: string;
  canReadClients: boolean;
  canReadProducts: boolean;
  canReadActivityLogs: boolean;
  isSuperAdmin?: boolean;
  kpis: DashboardKpis;
};

const SalesChart = dynamic(
  () => import("@/components/dashboard/sales-chart").then((m) => ({ default: m.SalesChart })),
  {
    loading: () => <Skeleton className="h-36 w-full rounded-2xl" />,
    ssr: false,
  },
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DashboardClient({
  userDisplayName,
  canReadClients,
  canReadProducts,
  canReadActivityLogs,
  isSuperAdmin = false,
  kpis,
}: DashboardClientProps) {
  const greeting    = useMemo(() => getGreeting(), []);
  const displayName = userDisplayName.trim() || "Compte";
  const firstName = displayName.split(" ")[0] || displayName;
  const initials = displayName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const frenchDate = useMemo(
    () => new Date().toLocaleDateString("fr-FR", { dateStyle: "full" }),
    [],
  );
  const hasStockAlert = kpis.productsOutOfStock > 0 || kpis.productsLowStock > 0;

  // Currency logic
  const currency = useCurrencyStore((s) => s.selectedCurrency);
  
  const { converted: salesTodayConverted } = useCurrencyConversion({
    amount: kpis.salesAmountToday,
    from: "GNF",
    to: currency,
  });
  
  const { converted: salesMonthConverted } = useCurrencyConversion({
    amount: kpis.salesAmountMonth,
    from: "GNF",
    to: currency,
  });

  const salesTodayDisplay = useMemo(() => 
    salesTodayConverted === null ? "Conversion indisponible" : formatCurrency(salesTodayConverted, currency),
    [salesTodayConverted, currency]
  );

  const salesMonthDisplay = useMemo(() => 
    salesMonthConverted === null ? "Conversion indisponible" : formatCurrency(salesMonthConverted, currency),
    [salesMonthConverted, currency]
  );

  return (
    <div className="page-wrapper mx-auto max-w-6xl">
      <PageHeader title={NAV_LABELS.home} subtitle="Vue globale de l'activité opérationnelle" />

      {/* Welcome banner */}
      <div className="rounded-card bg-[linear-gradient(135deg,#0E4A8A_0%,#2D7CC4_50%,#3FA9D6_100%)] p-8 text-white shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">
              {greeting} {firstName} 👋
            </h2>
            <p className="mt-2 text-sm text-white/85">
              Voici votre tableau de bord — {frenchDate}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
            {initials}
          </div>
        </div>
      </div>

      {/* Stock Alert */}
      {hasStockAlert && canReadProducts && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <AlertTriangle size={18} className="shrink-0 text-amber-600" />
          <p className="flex-1 text-sm text-amber-800">
            {kpis.productsOutOfStock > 0 && <span className="font-semibold">{kpis.productsOutOfStock} en rupture. </span>}
            {kpis.productsLowStock > 0 && <span>{kpis.productsLowStock} produit(s) à stock faible.</span>}
          </p>
          <Link
            href="/vente/produits"
            className="shrink-0 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-amber-700"
          >
            Voir →
          </Link>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Clients actifs" value={kpis.clientsTotal} icon={Users} color="blue" subtitle="Base clients totale" />
        <StatsCard title="Ventes aujourd'hui" value={kpis.salesToday} icon={ShoppingCart} color="green" subtitle={kpis.salesAmountToday > 0 ? salesTodayDisplay : "Aucune vente"} />
        <StatsCard title="CA ce mois" value={salesMonthDisplay} icon={TrendingUp} color="purple" subtitle={`${kpis.salesCountMonth} transaction${kpis.salesCountMonth !== 1 ? "s" : ""}`} />
        <StatsCard
          title="Stock à surveiller"
          value={kpis.productsLowStock + kpis.productsOutOfStock}
          icon={Package}
          color={hasStockAlert ? "orange" : "blue"}
          subtitle={kpis.productsOutOfStock > 0 ? `${kpis.productsOutOfStock} en rupture` : "Tout va bien"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Sales Chart (Lazy Loaded) */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-darktext">
                <BarChart2 size={16} className="text-primary" />
                Ventes — 7 derniers jours
              </h2>
              <p className="text-xs text-gray-400">Montant total en GNF</p>
            </div>
            <Link href="/vente/historique" className="text-xs font-medium text-primary hover:underline">Voir tout →</Link>
          </div>
          <SalesChart data={kpis.salesLast7Days} />
        </div>

        {/* Activity Timeline (Memoized) */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-darktext">
              <Activity size={15} className="text-primary" />
              Activité récente
            </h2>
            {canReadActivityLogs && (
              <Link href="/admin/activity-logs" className="text-xs font-medium text-primary hover:underline">Tout →</Link>
            )}
          </div>
          <ActivityTimeline events={kpis.recentActivity} />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="section-title">Actions rapides</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {canReadProducts && <QuickActionCard href={ROUTES.newSale} icon={ShoppingCart} label="Nouvelle vente" description="Encaisser un client maintenant" color="bg-primary/10 text-primary" />}
          {canReadClients && <QuickActionCard href={withCreateModalQuery(ROUTES.clients)} icon={UserPlus} label="Ajouter un client" description="Créer une fiche client" color="bg-emerald-50 text-emerald-600" />}
          {canReadProducts && <QuickActionCard href={withCreateModalQuery(ROUTES.produits)} icon={PlusCircle} label="Ajouter un produit" description="Référencer un nouveau produit" color="bg-sky-50 text-sky-600" />}
          {canReadActivityLogs && <QuickActionCard href="/admin/activity-logs" icon={ClipboardList} label="Journal d'activité" description="Consulter les logs système" color="bg-violet-50 text-violet-600" />}
          {canReadProducts && <QuickActionCard href={ROUTES.history} icon={TrendingUp} label="Historique des ventes" description="Voir toutes les transactions" color="bg-orange-50 text-orange-600" />}
          {isSuperAdmin && <QuickActionCard href="/admin/users" icon={UserCog} label="Gérer les utilisateurs" description="Inviter et configurer les accès" color="bg-pink-50 text-pink-600" />}
        </div>
      </div>

    </div>
  );
}
