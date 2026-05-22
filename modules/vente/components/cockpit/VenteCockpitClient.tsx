"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Banknote,
  Bell,
  FileText,
  GitBranch,
  LineChart,
  ShoppingCart,
  Target,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { CockpitMetricCard } from "@/components/dashboard/super-admin-cockpit/CockpitMetricCard";
import { ActivityTimeline } from "@/app/(app)/dashboard/components/ActivityTimeline";
import { QuickActionCard } from "@/app/(app)/dashboard/components/QuickActionCard";
import { COCKPIT_ZONE_ORDER } from "@/lib/navigation/erp-ux-architecture";
import type { VenteCockpitPayload } from "@/lib/vente/runtime/vente-cockpit-payload";
import { formatMoneyGnf } from "@/modules/crm/utils/format-money";

const SalesChart = dynamic(
  () => import("@/components/dashboard/sales-chart").then((m) => ({ default: m.SalesChart })),
  { ssr: false, loading: () => <div className="h-36 animate-pulse rounded-lg bg-gray-100" /> },
);

const ZONE_LABELS: Record<(typeof COCKPIT_ZONE_ORDER)[number], string> = {
  context_header: "Contexte",
  kpi_primary: "Indicateurs",
  alerts: "Alertes",
  charts: "Graphiques",
  recent_activity: "Activité récente",
  quick_actions: "Actions rapides",
};

const QUICK_ACTION_ICONS: Record<string, typeof ShoppingCart> = {
  new_sale: ShoppingCart,
  new_client: Users,
  new_lead: UserPlus,
  new_quote: FileText,
  pipeline: GitBranch,
  crm_hub: Target,
};

const QUICK_ACTION_COLORS: Record<string, string> = {
  new_sale: "bg-emerald-50 text-emerald-700",
  new_client: "bg-blue-50 text-blue-700",
  new_lead: "bg-indigo-50 text-indigo-700",
  new_quote: "bg-violet-50 text-violet-700",
  pipeline: "bg-amber-50 text-amber-700",
  crm_hub: "bg-sky-50 text-sky-700",
};

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
};

function sparklineFromDays(days: VenteCockpitPayload["salesLast7Days"]): number[] {
  const max = Math.max(...days.map((d) => d.amount), 1);
  return days.map((d) => d.amount / max);
}

type VenteCockpitClientProps = {
  payload: VenteCockpitPayload;
};

export function VenteCockpitClient({ payload }: VenteCockpitClientProps) {
  const spark = sparklineFromDays(payload.salesLast7Days);
  const alertCount = payload.alerts.length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Cockpit Vente"
        subtitle="Pilotage commercial — CA, pipeline CRM et alertes opérationnelles."
      />

      <section
        aria-label={ZONE_LABELS.context_header}
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <p className="text-sm text-gray-600">
          Bonjour <span className="font-semibold text-gray-900">{payload.userDisplayName}</span> —{" "}
          Vente
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {alertCount > 0
            ? `${alertCount} alerte(s) à traiter`
            : "Aucune alerte critique"}
          {" · "}
          Sources : {payload.commerceSource}, {payload.crmSource}
        </p>
      </section>

      <section aria-label={ZONE_LABELS.kpi_primary}>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          {ZONE_LABELS.kpi_primary}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CockpitMetricCard
            title="CA net du jour"
            value={formatMoneyGnf(payload.netRevenueToday)}
            subtitle={`${payload.salesCountToday} vente(s) · ${payload.commerceSource}`}
            icon={Banknote}
            color="green"
            sparkline={spark}
          />
          <CockpitMetricCard
            title="CA net du mois"
            value={formatMoneyGnf(payload.netRevenueMonth)}
            subtitle="Ventes validées (lifecycle)"
            icon={LineChart}
            color="blue"
          />
          <CockpitMetricCard
            title="Pipeline pondéré"
            value={formatMoneyGnf(payload.weightedPipelineGnf)}
            subtitle={`${payload.openOpportunities} opportunité(s) ouverte(s)`}
            icon={GitBranch}
            color="purple"
          />
          <CockpitMetricCard
            title="Leads actifs"
            value={payload.activeLeads}
            subtitle={`${payload.openQuotes} devis en cours`}
            icon={UserPlus}
            color="orange"
          />
          <CockpitMetricCard
            title="Clients"
            value={payload.clientsTotal}
            subtitle="Base clients active"
            icon={Users}
            color="blue"
          />
          <CockpitMetricCard
            title="Activités CRM"
            value={payload.openActivities}
            subtitle="À compléter"
            icon={Activity}
            color="orange"
          />
          <CockpitMetricCard
            title="Stock bas"
            value={payload.productsLowStock}
            subtitle={`${payload.productsOutOfStock} rupture(s)`}
            icon={AlertTriangle}
            color={payload.productsOutOfStock > 0 ? "red" : "orange"}
          />
          <CockpitMetricCard
            title="Ventes du jour"
            value={payload.salesCountToday}
            subtitle="Nombre de transactions"
            icon={ShoppingCart}
            color="green"
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          aria-label={ZONE_LABELS.alerts}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center gap-2">
            <Bell size={16} className="text-amber-600" />
            <h2 className="text-sm font-semibold text-gray-800">{ZONE_LABELS.alerts}</h2>
          </div>
          {payload.alerts.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-6 text-sm text-gray-500">
              <AlertTriangle size={16} className="shrink-0 text-gray-400" />
              Aucune alerte active.
            </div>
          ) : (
            <ul className="space-y-2">
              {payload.alerts.map((a) => (
                <li key={a.id}>
                  <Link
                    href={a.href}
                    className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm transition hover:opacity-90 ${ALERT_STYLES[a.level]}`}
                  >
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>{a.message}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-label={ZONE_LABELS.charts}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center gap-2">
            <LineChart size={16} className="text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-800">CA net — 7 derniers jours</h2>
          </div>
          <SalesChart data={payload.salesLast7Days} />
        </section>
      </div>

      <section
        aria-label={ZONE_LABELS.recent_activity}
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="mb-3 flex items-center gap-2">
          <Activity size={16} className="text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-800">{ZONE_LABELS.recent_activity}</h2>
        </div>
        <ActivityTimeline events={payload.recentActivity} />
      </section>

      <section
        aria-label={ZONE_LABELS.quick_actions}
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="mb-3 flex items-center gap-2">
          <Zap size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-gray-800">{ZONE_LABELS.quick_actions}</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {payload.quickActions.map((action) => {
            const Icon = QUICK_ACTION_ICONS[action.id] ?? ShoppingCart;
            const color = QUICK_ACTION_COLORS[action.id] ?? "bg-gray-50 text-gray-700";
            return (
              <QuickActionCard
                key={action.id}
                href={action.href}
                icon={Icon}
                label={action.label}
                description={action.description}
                color={color}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
