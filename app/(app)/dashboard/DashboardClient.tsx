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
  BriefcaseBusiness,
  Truck,
  BarChart3,
  Zap,
  LayoutDashboard,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { useCurrencyStore } from "@/stores/currencyStore";
import { formatCurrency } from "@/utils/currency";
import type { DashboardKpis } from "@/lib/server/dashboard-kpis";
import { withCreateModalQuery } from "@/lib/routing/modal-query";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";
import { ROUTES } from "@/lib/constants/routes";
import { DEPARTMENTS } from "@/lib/constants/departments";
import { DeptCard } from "@/components/dept/dept-card";

import { ActivityTimeline } from "./components/ActivityTimeline";
import { QuickActionCard } from "./components/QuickActionCard";

type DashboardClientProps = {
  userDisplayName: string;
  canReadClients: boolean;
  canReadProducts: boolean;
  canReadFinance: boolean;
  canReadLogistics: boolean;
  canReadCrm: boolean;
  canReadRh: boolean;
  canReadActivityLogs: boolean;
  isSuperAdmin?: boolean;
  showExecutiveLink?: boolean;
  kpis: DashboardKpis;
};

const SalesChart = dynamic(
  () => import("@/components/dashboard/sales-chart").then((m) => ({ default: m.SalesChart })),
  {
    loading: () => <Skeleton className="h-36 w-full rounded-2xl" />,
    ssr: false,
  },
);

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export function DashboardClient({
  userDisplayName,
  canReadClients,
  canReadProducts,
  canReadFinance,
  canReadLogistics,
  canReadCrm,
  canReadRh,
  canReadActivityLogs,
  isSuperAdmin = false,
  showExecutiveLink = false,
  kpis,
}: DashboardClientProps) {
  const greeting = useMemo(() => getGreeting(), []);
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

  const salesTodayDisplay = useMemo(
    () =>
      salesTodayConverted === null ? "Conversion indisponible" : formatCurrency(salesTodayConverted, currency),
    [salesTodayConverted, currency],
  );

  const salesMonthDisplay = useMemo(
    () =>
      salesMonthConverted === null ? "Conversion indisponible" : formatCurrency(salesMonthConverted, currency),
    [salesMonthConverted, currency],
  );

  const moduleShortcuts = useMemo(() => {
    const items: { href: string; label: string; description: string; icon: typeof Users }[] = [];
    if (canReadRh) items.push({ href: ROUTES.rh, label: "RH", description: "Effectifs et temps", icon: Users });
    if (canReadFinance)
      items.push({ href: ROUTES.finance, label: "Finance", description: "Trésorerie et dépenses", icon: BarChart3 });
    if (canReadCrm)
      items.push({
        href: ROUTES.crm,
        label: "CRM",
        description: "Pipeline et clients",
        icon: BriefcaseBusiness,
      });
    if (canReadClients || canReadProducts)
      items.push({
        href: ROUTES.clients,
        label: "Vente",
        description: "Clients et commandes",
        icon: ShoppingCart,
      });
    if (canReadLogistics)
      items.push({ href: ROUTES.logistics, label: "Logistique", description: "Stock et livraisons", icon: Truck });
    return items;
  }, [canReadRh, canReadFinance, canReadCrm, canReadClients, canReadProducts, canReadLogistics]);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Accueil"
        subtitle="Cockpit entreprise — synthèse opérationnelle et accès aux modules"
      />

      <div className="rounded-card bg-[linear-gradient(135deg,#0E4A8A_0%,#2D7CC4_50%,#3FA9D6_100%)] p-6 text-white shadow-card sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              {greeting}, {firstName}
            </h2>
            <p className="mt-2 text-sm text-white/90">{frenchDate}</p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
            {initials}
          </div>
        </div>
      </div>

      {showExecutiveLink ? (
        <Link
          href={ROUTES.executive}
          className="card flex items-center justify-between gap-4 p-4 transition-shadow hover:shadow-md sm:p-5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LayoutDashboard size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-darktext">Pilotage exécutif</p>
              <p className="text-xs text-gray-500">Vue consolidée multi-départements</p>
            </div>
          </div>
          <span className="shrink-0 text-sm font-medium text-primary">Ouvrir</span>
        </Link>
      ) : null}

      {canReadActivityLogs ? (
        <Link
          href={ROUTES.actions}
          className="card flex items-center justify-between gap-4 border border-gray-100 p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-darktext">Actions et files</p>
              <p className="text-xs text-gray-500">Approbations, journaux et tâches administratives</p>
            </div>
          </div>
          <span className="text-sm font-medium text-primary">Accéder</span>
        </Link>
      ) : null}

      {hasStockAlert && canReadProducts ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-3.5">
          <AlertTriangle size={18} className="shrink-0 text-amber-600" />
          <p className="flex-1 text-sm text-amber-900">
            {kpis.productsOutOfStock > 0 ? (
              <span className="font-semibold">{kpis.productsOutOfStock} produit(s) en rupture. </span>
            ) : null}
            {kpis.productsLowStock > 0 ? <span>{kpis.productsLowStock} produit(s) à stock faible.</span> : null}
          </p>
          <Link
            href={ROUTES.produits}
            className="shrink-0 self-start rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 sm:self-center"
          >
            Voir le stock
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Clients actifs" value={kpis.clientsTotal} icon={Users} color="blue" subtitle="Base clients" />
        <StatsCard
          title="Ventes du jour"
          value={kpis.salesToday}
          icon={ShoppingCart}
          color="green"
          subtitle={kpis.salesAmountToday > 0 ? salesTodayDisplay : "Aucune vente"}
        />
        <StatsCard
          title="Chiffre du mois"
          value={salesMonthDisplay}
          icon={TrendingUp}
          color="purple"
          subtitle={`${kpis.salesCountMonth} transaction${kpis.salesCountMonth !== 1 ? "s" : ""}`}
        />
        <StatsCard
          title="Stock à surveiller"
          value={kpis.productsLowStock + kpis.productsOutOfStock}
          icon={Package}
          color={hasStockAlert ? "orange" : "blue"}
          subtitle={kpis.productsOutOfStock > 0 ? `${kpis.productsOutOfStock} en rupture` : "Sous contrôle"}
        />
      </div>

      <section className="space-y-3">
        <h2 className="section-title">Départements</h2>
        <p className="text-sm text-gray-600">Accédez au pilotage par pôle depuis une entrée unique.</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {DEPARTMENTS.map((d) => (
            <DeptCard key={d.key} departmentKey={d.key} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={ROUTES.dept} className="text-sm font-medium text-primary hover:underline">
            Vue supervision départements
          </Link>
        </div>
      </section>

      {moduleShortcuts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="section-title">Accès modules</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {moduleShortcuts.map((m) => {
              const Icon = m.icon;
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  className="card flex items-start gap-3 p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-primary">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-darktext">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card flex flex-col p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-darktext">
                <BarChart2 size={16} className="text-primary" />
                Ventes — 7 derniers jours
              </h2>
              <p className="text-xs text-gray-500">Montant total (GNF)</p>
            </div>
            <Link href={ROUTES.history} className="text-xs font-medium text-primary hover:underline">
              Historique
            </Link>
          </div>
          <SalesChart data={kpis.salesLast7Days} />
        </div>

        <div className="card flex flex-col p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold text-darktext">
              <Activity size={15} className="text-primary" />
              Activité récente
            </h2>
            {canReadActivityLogs ? (
              <Link href="/admin/activity-logs" className="text-xs font-medium text-primary hover:underline">
                Journal
              </Link>
            ) : null}
          </div>
          <ActivityTimeline events={kpis.recentActivity} />
        </div>
      </div>

      <section>
        <h2 className="section-title">Actions rapides</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {canReadProducts ? (
            <QuickActionCard
              href={ROUTES.newSale}
              icon={ShoppingCart}
              label="Nouvelle vente"
              description="Enregistrer une vente"
              color="bg-primary/10 text-primary"
            />
          ) : null}
          {canReadClients ? (
            <QuickActionCard
              href={withCreateModalQuery(ROUTES.clients)}
              icon={UserPlus}
              label="Nouveau client"
              description="Créer une fiche"
              color="bg-emerald-50 text-emerald-600"
            />
          ) : null}
          {canReadProducts ? (
            <QuickActionCard
              href={withCreateModalQuery(ROUTES.produits)}
              icon={PlusCircle}
              label="Nouveau produit"
              description="Référencer un article"
              color="bg-sky-50 text-sky-600"
            />
          ) : null}
          {canReadActivityLogs ? (
            <QuickActionCard
              href="/admin/activity-logs"
              icon={ClipboardList}
              label="Journal d'activité"
              description="Traçabilité des opérations"
              color="bg-violet-50 text-violet-600"
            />
          ) : null}
          {canReadProducts ? (
            <QuickActionCard
              href={ROUTES.history}
              icon={TrendingUp}
              label="Historique des ventes"
              description="Transactions et encaissements"
              color="bg-orange-50 text-orange-600"
            />
          ) : null}
          {isSuperAdmin ? (
            <QuickActionCard
              href="/admin/users"
              icon={UserCog}
              label="Utilisateurs"
              description="Rôles et accès"
              color="bg-pink-50 text-pink-600"
            />
          ) : null}
          {canReadFinance ? (
            <QuickActionCard
              href={ROUTES.depenses}
              icon={BarChart3}
              label="Dépenses"
              description="Suivi des charges"
              color="bg-teal-50 text-teal-700"
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
