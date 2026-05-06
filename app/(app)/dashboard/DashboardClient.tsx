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
import { KpiCard } from "@/components/ui/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyStore } from "@/stores/currencyStore";
import { formatCurrency } from "@/utils/currency";
import type { DashboardKpis } from "@/lib/server/dashboard-kpis";
import { withCreateModalQuery } from "@/lib/routing/modal-query";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";

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
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-light p-6 text-white shadow-sm">
        <p className="text-sm font-medium text-white/70">{greeting},</p>
        <h1 className="mt-1 text-2xl font-bold">{displayName} 👋</h1>
        <p className="mt-1 text-sm text-white/60">Voici un aperçu de votre activité du jour.</p>
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
        <KpiCard label="Clients actifs" value={kpis.clientsTotal} icon={Users} iconColor="text-primary" iconBg="bg-primary/10" sub="Base clients totale" />
        <KpiCard label="Ventes aujourd'hui" value={kpis.salesToday} icon={ShoppingCart} iconColor="text-emerald-600" iconBg="bg-emerald-50" sub={kpis.salesAmountToday > 0 ? salesTodayDisplay : "Aucune vente"} />
        <KpiCard label="CA ce mois" value={salesMonthDisplay} icon={TrendingUp} iconColor="text-sky-600" iconBg="bg-sky-50" sub={`${kpis.salesCountMonth} transaction${kpis.salesCountMonth !== 1 ? "s" : ""}`} />
        <KpiCard
          label="Stock à surveiller"
          value={kpis.productsLowStock + kpis.productsOutOfStock}
          icon={Package}
          iconColor={hasStockAlert ? "text-amber-600" : "text-gray-400"}
          iconBg={hasStockAlert ? "bg-amber-50" : "bg-gray-100"}
          sub={kpis.productsOutOfStock > 0 ? `${kpis.productsOutOfStock} en rupture` : "Tout va bien"}
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
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Actions rapides</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {canReadProducts && <QuickActionCard href="/vente/nouvelle-vente" icon={ShoppingCart} label="Nouvelle vente" description="Encaisser un client maintenant" color="bg-primary/10 text-primary" />}
          {canReadClients && <QuickActionCard href={withCreateModalQuery("/vente/clients")} icon={UserPlus} label="Ajouter un client" description="Créer une fiche client" color="bg-emerald-50 text-emerald-600" />}
          {canReadProducts && <QuickActionCard href={withCreateModalQuery("/vente/produits")} icon={PlusCircle} label="Ajouter un produit" description="Référencer un nouveau produit" color="bg-sky-50 text-sky-600" />}
          {canReadActivityLogs && <QuickActionCard href="/admin/activity-logs" icon={ClipboardList} label="Journal d'activité" description="Consulter les logs système" color="bg-violet-50 text-violet-600" />}
          {canReadProducts && <QuickActionCard href="/vente/historique" icon={TrendingUp} label="Historique des ventes" description="Voir toutes les transactions" color="bg-orange-50 text-orange-600" />}
          {isSuperAdmin && <QuickActionCard href="/admin/users" icon={UserCog} label="Gérer les utilisateurs" description="Inviter et configurer les accès" color="bg-pink-50 text-pink-600" />}
        </div>
      </div>

    </div>
  );
}
