"use client";

import { useEffect, useMemo, useState, memo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  ClipboardCheck,
  FileSearch,
  Megaphone,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  UserCog,
  GraduationCap,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { SuperAdminCockpitPayload } from "@/lib/server/super-admin-cockpit";
import { useCurrencyStore } from "@/stores/currencyStore";
import { formatCurrency } from "@/utils/currency";
import { useCurrencyBatchConversion } from "@/hooks/useCurrencyConversion";
import { ROUTES, SETTINGS_OFFICIAL_ROUTES } from "@/lib/constants/routes";
import {
  ActivityFeed,
  DashboardBanner,
  EmptyChart,
  KpiCard,
  SectionLabel,
} from "@/components/dashboard";
import { getGreeting } from "@/lib/utils/safe-query";
import { DomainMixChart, type DomainMixPoint } from "./DomainMixChart";
import { PlatformTrendLine } from "./PlatformTrendLine";
import { splitWindowTrendFromDays, statValue } from "./cockpit-helpers";

const SalesChart = dynamic(
  () => import("@/components/dashboard/sales-chart").then((m) => ({ default: m.SalesChart })),
  {
    loading: () => <Skeleton className="h-40 w-full rounded-2xl" />,
    ssr: false,
  },
);

type Props = {
  payload: SuperAdminCockpitPayload;
};

const SUPERVISION_DEPTS: {
  key: "vente" | "finance" | "rh" | "formation" | "marketing" | "logistique";
  label: string;
  route: string;
}[] = [
  { key: "vente", label: "Vente", route: "/dept/vente" },
  { key: "finance", label: "Finance", route: "/dept/finance" },
  { key: "rh", label: "RH", route: "/dept/rh" },
  { key: "formation", label: "Formation", route: "/dept/formation" },
  { key: "marketing", label: "Marketing", route: "/dept/marketing" },
  { key: "logistique", label: "Logistique", route: "/dept/logistique" },
];

function getGreetingLocal(): string {
  return getGreeting();
}

function severityRank(s: string): number {
  if (s === "critical") return 4;
  if (s === "high") return 3;
  if (s === "medium") return 2;
  return 1;
}

function severityStyles(s: string): { bar: string; badge: string } {
  if (s === "critical") return { bar: "border-l-red-600", badge: "bg-red-100 text-red-800" };
  if (s === "high") return { bar: "border-l-orange-500", badge: "bg-orange-100 text-orange-900" };
  if (s === "medium") return { bar: "border-l-amber-400", badge: "bg-amber-50 text-amber-900" };
  return { bar: "border-l-slate-300", badge: "bg-slate-100 text-slate-700" };
}

function formatTs(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export const SuperAdminCockpitClient = memo(function SuperAdminCockpitClient({ payload }: Props) {
  const { kpis, accueil, executive, pendingApprovals, governanceAlerts, generatedAtIso } = payload;
  const metrics = accueil.metrics;
  const domains = executive?.domains;

  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const greeting = useMemo(() => getGreetingLocal(), []);
  const firstName = accueil.userDisplay.firstName;

  const frenchDate = useMemo(
    () =>
      new Date(nowTick).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [nowTick],
  );
  const clock = useMemo(
    () => new Date(nowTick).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    [nowTick],
  );

  const revenueMonth = metrics.revenueMonth;
  const expensesMonth = metrics.expensesMonth;
  const marginMonth = metrics.profitMonth;
  const activeContracts = metrics.activeEmployees;

  const currency = useCurrencyStore((s) => s.selectedCurrency);
  const batchAmounts = useMemo(
    () => [
      { key: "revenue", amount: revenueMonth },
      { key: "expenses", amount: expensesMonth },
      { key: "margin", amount: marginMonth },
      { key: "salesMonth", amount: metrics.revenueMonth },
      { key: "venteMonth", amount: statValue(domains?.vente, "salesThisMonth") },
    ],
    [revenueMonth, expensesMonth, marginMonth, metrics.revenueMonth, domains?.vente],
  );
  const { convertedByKey, loading: convLoading } = useCurrencyBatchConversion(batchAmounts, "GNF", currency);

  const fmtMoney = (key: string, raw: number) => {
    const c = convertedByKey[key];
    if (convLoading && c === undefined) return "…";
    if (c === null) return `${raw.toLocaleString("fr-FR")} GNF`;
    if (c === undefined) return `${raw.toLocaleString("fr-FR")} GNF`;
    return formatCurrency(c, currency);
  };

  const trendRevenue = useMemo(
    () => splitWindowTrendFromDays(metrics.salesLast7Days, "amount"),
    [metrics.salesLast7Days],
  );
  const trendSalesCount = useMemo(
    () => splitWindowTrendFromDays(metrics.salesLast7Days, "count"),
    [metrics.salesLast7Days],
  );

  const stockCritical = metrics.stockCritical;

  const criticalNotes =
    (governanceAlerts.filter((a) => a.severity === "critical" || a.severity === "high").length ?? 0) +
    (pendingApprovals > 0 ? 1 : 0) +
    (kpis.productsOutOfStock > 0 ? 1 : 0) +
    (kpis.deletesClientsLast24h > 0 ? 1 : 0);

  const platformOk = criticalNotes === 0;

  const domainMix: DomainMixPoint[] = useMemo(() => {
    if (!domains) return [];
    return [
      { key: "vente", label: "Vente", value: statValue(domains.vente, "salesThisMonth") },
      { key: "finance", label: "Finance", value: statValue(domains.finance, "margin") },
      { key: "rh", label: "RH", value: statValue(domains.rh, "activeContracts") },
      {
        key: "formation",
        label: "Formation",
        value:
          domains.formation?.metadata?.placeholder || !domains.formation?.stats[0]?.id
            ? 0
            : statValue(domains.formation, domains.formation.stats[0].id),
      },
      {
        key: "marketing",
        label: "Marketing",
        value:
          domains.marketing?.metadata?.placeholder || !domains.marketing?.stats[0]?.id
            ? 0
            : statValue(domains.marketing, domains.marketing.stats[0].id),
      },
      { key: "logistique", label: "Logistique", value: statValue(domains.logistique, "jobsPending") },
    ];
  }, [domains]);

  const showDomainMix = domainMix.some((d) => d.value > 0);

  const quickAlerts = useMemo(() => {
    type Row = {
      id: string;
      severity: "critical" | "high" | "medium" | "low";
      title: string;
      detail: string;
      ts: string;
    };
    const rows: Row[] = governanceAlerts.map((a) => ({
      id: `ga-${a.id}`,
      severity: a.severity,
      title: a.title,
      detail: a.description.slice(0, 160),
      ts: a.created_at,
    }));
    const mentionsStock = rows.some((r) => /rupture|stock\s*critique|^stock\b/i.test(r.title));
    const mentionsApprovals = rows.some((r) =>
      /approbation|validation|demande\s+d'|pending\s+approval/i.test(r.title),
    );
    if (kpis.productsOutOfStock > 0 && !mentionsStock) {
      rows.push({
        id: "stock-out",
        severity: "high",
        title: "Stock critique",
        detail: `${kpis.productsOutOfStock} produit(s) en rupture de stock.`,
        ts: generatedAtIso,
      });
    }
    if (kpis.deletesClientsLast24h > 0) {
      rows.push({
        id: "client-del",
        severity: "medium",
        title: "Suppressions clients (24h)",
        detail: `${kpis.deletesClientsLast24h} suppression(s) enregistrée(s) sur la période.`,
        ts: generatedAtIso,
      });
    }
    if (pendingApprovals > 0 && !mentionsApprovals) {
      rows.push({
        id: "approvals-pending",
        severity: pendingApprovals > 20 ? "high" : "medium",
        title: "Validations en attente",
        detail: `${pendingApprovals} demande(s) d'approbation à traiter.`,
        ts: generatedAtIso,
      });
    }
    rows.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
    return rows.slice(0, 6);
  }, [governanceAlerts, kpis.deletesClientsLast24h, kpis.productsOutOfStock, pendingApprovals, generatedAtIso]);


  return (
    <div className="page-wrapper space-y-6 pb-10">
      <DashboardBanner
        greeting={greeting}
        firstName={firstName}
        date={frenchDate}
        time={clock}
        subtitle="Cockpit central"
        platformOk={platformOk}
        priorityCount={criticalNotes}
      />

      <section aria-labelledby="kpi-heading" className="space-y-3">
        <SectionLabel label="KPI globaux" rightSlot="Mois en cours · ventes agrégées ERP" />
        <div id="kpi-heading" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard title="Revenus du mois" value={fmtMoney("revenue", revenueMonth)} subtitle="Ventes enregistrées" icon={TrendingUp} color="green" trend={{ label: trendRevenue.label, direction: trendRevenue.up ? "up" : "down" }} />
          <KpiCard title="Ventes du mois" value={metrics.salesCountMonth} subtitle={`CA net : ${fmtMoney("salesMonth", metrics.revenueMonth)}`} icon={ShoppingCart} color="blue" trend={{ label: trendSalesCount.label, direction: trendSalesCount.up ? "up" : "down" }} />
          <KpiCard title="Dépenses du mois" value={fmtMoney("expenses", expensesMonth)} subtitle="Dépenses enregistrées" icon={BarChart3} color="orange" />
          <KpiCard title="Bénéfice net" value={fmtMoney("margin", marginMonth)} subtitle="Revenus − dépenses" icon={Activity} color={marginMonth < 0 ? "red" : "purple"} />
          <KpiCard title="Employés actifs" value={activeContracts} subtitle="Contrats actifs RH" icon={Users} color="blue" />
          <KpiCard title="Formations en cours" value={metrics.formationActive ?? 0} icon={GraduationCap} color="purple" isEmpty={metrics.formationEmpty} />
          <KpiCard title="Campagnes marketing" value={metrics.marketingActive ?? 0} icon={Megaphone} color="pink" isEmpty={metrics.marketingEmpty} />
          <KpiCard title="Produits sous seuil" value={stockCritical} subtitle={kpis.productsOutOfStock > 0 ? `${kpis.productsOutOfStock} rupture(s), ${kpis.productsLowStock} faible(s)` : "Seuils produits"} icon={Package} color={stockCritical > 0 ? "orange" : "green"} />
          <KpiCard title="En attente de validation" value={metrics.pendingApprovals} subtitle="Approbations gouvernance" icon={ClipboardCheck} color={metrics.pendingApprovals > 0 ? "orange" : "green"} />
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="charts-heading">
        <h2 id="charts-heading" className="section-title">
          Graphiques globaux
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card space-y-2 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-darktext">Évolution revenus (7 j.)</p>
              <BarChart3 size={16} className="shrink-0 text-primary" />
            </div>
            <p className="text-xs text-gray-500">CA net journalier — base ventes.</p>
            {metrics.salesLast7Days.length === 0 ? <EmptyChart /> : <SalesChart data={metrics.salesLast7Days} />}
          </div>
          <div className="card space-y-2 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-darktext">Tendance CA net (7 j.)</p>
              <TrendingUp size={16} className="shrink-0 text-primary" />
            </div>
            <p className="text-xs text-gray-500">Courbe consolidée — même périmètre que le strip ventes.</p>
            {metrics.salesLast7Days.length === 0 ? <EmptyChart message="Courbe disponible dès les premières ventes" /> : <PlatformTrendLine data={metrics.salesLast7Days} />}
          </div>
          {showDomainMix ? (
            <div className="card space-y-2 p-4 sm:p-5 lg:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-darktext">Activité / charge par département</p>
                <Activity size={16} className="shrink-0 text-primary" />
              </div>
              <DomainMixChart data={domainMix} valueLabel="Valeur" />
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card flex flex-col p-4 sm:p-5" aria-labelledby="alerts-heading">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id="alerts-heading" className="text-sm font-semibold text-darktext">
              Alertes rapides
            </h2>
            <Link href="/admin/alerts" className="text-xs font-medium text-primary hover:underline">
              Voir tout
            </Link>
          </div>
          <p className="mb-3 text-xs text-gray-500">Aperçu — les files complètes restent dans Actions / Alertes.</p>
          {quickAlerts.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune alerte prioritaire détectée sur les sources connectées.</p>
          ) : (
            <ul className="space-y-2">
              {quickAlerts.map((a) => {
                const st = severityStyles(a.severity);
                return (
                  <li
                    key={a.id}
                    className={`rounded-xl border border-gray-100 border-l-4 ${st.bar} bg-gray-50/60 px-3 py-2.5`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-badge px-2 py-0.5 text-[10px] font-semibold uppercase ${st.badge}`}>
                        {a.severity}
                      </span>
                      <span className="text-[11px] text-gray-400">{formatTs(a.ts)}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-darktext">{a.title}</p>
                    <p className="text-xs text-gray-600">{a.detail}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card flex flex-col p-4 sm:p-5">
          <ActivityFeed items={accueil.activities} viewAllHref="/admin/activity-logs" />
        </section>
      </div>

      <section className="space-y-3" aria-labelledby="dept-heading">
        <h2 id="dept-heading" className="section-title">
          Supervision départements
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {SUPERVISION_DEPTS.map((d) => {
            const dom = domains?.[d.key];
            const crit = (dom?.alerts ?? []).filter((x) => x.level === "critical").length;
            let primaryNum = 0;
            let primary = "—";
            let primaryLabel = "Indicateur";
            const isPlaceholder = Boolean(dom?.metadata?.placeholder);
            if (d.key === "vente") {
              primaryNum = statValue(dom, "salesThisMonth");
              primary = fmtMoney("venteMonth", primaryNum);
              primaryLabel = "CA mois";
            } else if (d.key === "finance") {
              primaryNum = statValue(dom, "margin");
              primary = fmtMoney("margin", primaryNum);
              primaryLabel = "Marge mois";
            } else if (d.key === "rh") {
              primaryNum = statValue(dom, "activeContracts");
              primary = String(primaryNum);
              primaryLabel = "Contrats actifs";
            } else if (d.key === "logistique") {
              primaryNum = statValue(dom, "jobsPending");
              primary = String(primaryNum);
              primaryLabel = "Jobs en file";
            } else if (d.key === "formation") {
              primaryNum = metrics.formationEmpty ? 0 : (metrics.formationActive ?? 0);
              primary = metrics.formationEmpty ? "—" : String(primaryNum);
              primaryLabel = "Formations actives";
            } else if (d.key === "marketing") {
              primaryNum = metrics.marketingEmpty ? 0 : (metrics.marketingActive ?? 0);
              primary = metrics.marketingEmpty ? "—" : String(primaryNum);
              primaryLabel = "Campagnes actives";
            }

            const moduleInactive =
              d.key === "formation"
                ? metrics.formationEmpty
                : d.key === "marketing"
                  ? metrics.marketingEmpty
                  : d.key === "logistique"
                    ? metrics.logistiqueEmpty
                    : false;

            const badgeLabel = moduleInactive
              ? "À activer"
              : primaryNum > 0
                ? "Stable"
                : isPlaceholder
                  ? "À activer"
                  : "En veille";
            const badgeClass =
              badgeLabel === "Stable"
                ? "bg-emerald-50 text-emerald-800"
                : badgeLabel === "À activer"
                  ? "bg-amber-50 text-amber-900"
                  : "bg-slate-100 text-slate-600";
            return (
              <Link
                key={d.key}
                href={d.route}
                className="card group flex flex-col border border-gray-100 p-4 transition-shadow hover:shadow-md sm:p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{d.label}</p>
                    <p className="mt-1 text-lg font-bold text-darktext">{primary}</p>
                    <p className="text-[11px] text-gray-500">{primaryLabel}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
                    {badgeLabel}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-500">
                  <span>{(dom?.activity ?? []).length} événement(s) récents</span>
                  {crit > 0 ? (
                    <span className="font-semibold text-red-600">{crit} alerte(s) critique(s)</span>
                  ) : (
                    <span>Aucune alerte critique domaine</span>
                  )}
                </div>
                <span className="mt-3 text-xs font-medium text-primary group-hover:underline">Vue supervision →</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="gov-actions-heading">
        <h2 id="gov-actions-heading" className="section-title">
          Actions rapides (gouvernance)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Link
            href="/admin/approvals"
            className="card flex items-center gap-3 border border-gray-100 p-4 transition hover:border-primary/30 hover:shadow-sm"
          >
            <ClipboardCheck className="shrink-0 text-primary" size={20} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-darktext">Validations</p>
              <p className="truncate text-xs text-gray-500">File d&apos;approbation</p>
            </div>
          </Link>
          <Link
            href="/admin/alerts"
            className="card flex items-center gap-3 border border-gray-100 p-4 transition hover:border-primary/30 hover:shadow-sm"
          >
            <AlertTriangle className="shrink-0 text-amber-600" size={20} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-darktext">Alertes</p>
              <p className="truncate text-xs text-gray-500">Gouvernance &amp; sécurité</p>
            </div>
          </Link>
          <Link
            href="/admin/audit"
            className="card flex items-center gap-3 border border-gray-100 p-4 transition hover:border-primary/30 hover:shadow-sm"
          >
            <FileSearch className="shrink-0 text-violet-600" size={20} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-darktext">Audits</p>
              <p className="truncate text-xs text-gray-500">Traces &amp; conformité</p>
            </div>
          </Link>
          <Link
            href={ROUTES.archives}
            className="card flex items-center gap-3 border border-gray-100 p-4 transition hover:border-primary/30 hover:shadow-sm"
          >
            <Archive className="shrink-0 text-slate-600" size={20} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-darktext">Archives</p>
              <p className="truncate text-xs text-gray-500">Conservation</p>
            </div>
          </Link>
          <Link
            href={SETTINGS_OFFICIAL_ROUTES.users}
            className="card flex items-center gap-3 border border-gray-100 p-4 transition hover:border-primary/30 hover:shadow-sm"
          >
            <UserCog className="shrink-0 text-sky-600" size={20} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-darktext">Utilisateurs</p>
              <p className="truncate text-xs text-gray-500">Accès &amp; rôles</p>
            </div>
          </Link>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <Link href={ROUTES.executive} className="font-medium text-primary hover:underline">
            Vue exécutive consolidée
          </Link>
          <span className="text-gray-300">|</span>
          <Link href={ROUTES.adminPlatformDashboard} className="font-medium text-primary hover:underline">
            Observabilité plateforme
          </Link>
        </div>
      </section>

    </div>
  );
});
