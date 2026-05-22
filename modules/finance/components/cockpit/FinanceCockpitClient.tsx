"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Banknote,
  Bell,
  BookOpen,
  FileText,
  Landmark,
  LineChart,
  PieChart,
  Receipt,
  TrendingDown,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { CockpitMetricCard } from "@/components/dashboard/super-admin-cockpit/CockpitMetricCard";
import { ActivityTimeline } from "@/app/(app)/dashboard/components/ActivityTimeline";
import { QuickActionCard } from "@/app/(app)/dashboard/components/QuickActionCard";
import { COCKPIT_ZONE_ORDER } from "@/lib/navigation/erp-ux-architecture";
import type { FinanceCockpitPayload } from "@/lib/finance/runtime/finance-cockpit-payload";
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

const QUICK_ACTION_ICONS: Record<string, typeof Banknote> = {
  cfo: LineChart,
  expenses: Receipt,
  enterprise: BookOpen,
  treasury: Landmark,
  invoicing: FileText,
  reporting: PieChart,
};

const QUICK_ACTION_COLORS: Record<string, string> = {
  cfo: "bg-emerald-50 text-emerald-700",
  expenses: "bg-orange-50 text-orange-700",
  enterprise: "bg-blue-50 text-blue-700",
  treasury: "bg-violet-50 text-violet-700",
  invoicing: "bg-sky-50 text-sky-700",
  reporting: "bg-gray-50 text-gray-700",
};

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
};

function sparklineFromDays(days: FinanceCockpitPayload["treasuryLast7Days"]): number[] {
  const max = Math.max(...days.map((d) => Math.abs(d.amount)), 1);
  return days.map((d) => Math.abs(d.amount) / max);
}

type FinanceCockpitClientProps = {
  payload: FinanceCockpitPayload;
};

export function FinanceCockpitClient({ payload }: FinanceCockpitClientProps) {
  const spark = sparklineFromDays(payload.treasuryLast7Days);
  const marginLabel =
    payload.marginPctMonth != null ? `${payload.marginPctMonth.toFixed(1)} %` : "—";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Cockpit Finance"
        subtitle="Pilotage trésorerie et comptabilité — CA net, dépenses, résultat et contrôles."
      />

      <section
        aria-label={ZONE_LABELS.context_header}
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <p className="text-sm text-gray-600">
          Bonjour <span className="font-semibold text-gray-900">{payload.userDisplayName}</span> — Finance
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {payload.alerts.length > 0
            ? `${payload.alerts.length} alerte(s) à traiter`
            : "Aucune alerte critique"}
          {" · "}
          Sources : {payload.treasurySource}, {payload.enterpriseSource}
        </p>
      </section>

      <section aria-label={ZONE_LABELS.kpi_primary}>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          {ZONE_LABELS.kpi_primary}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CockpitMetricCard
            title="CA net du mois"
            value={formatMoneyGnf(payload.netRevenueMonth)}
            subtitle={payload.treasurySource}
            icon={Banknote}
            color="green"
            sparkline={spark}
          />
          <CockpitMetricCard
            title="Dépenses du mois"
            value={formatMoneyGnf(payload.expensesMonth)}
            subtitle="financial_transactions actives"
            icon={Receipt}
            color="orange"
          />
          <CockpitMetricCard
            title="Résultat net"
            value={formatMoneyGnf(payload.profitMonth)}
            subtitle={`Marge ${marginLabel}`}
            icon={payload.profitMonth >= 0 ? LineChart : TrendingDown}
            color={payload.profitMonth >= 0 ? "blue" : "red"}
          />
          <CockpitMetricCard
            title="Résultat du jour"
            value={formatMoneyGnf(payload.profitToday)}
            subtitle={`Dépenses jour ${formatMoneyGnf(payload.expensesToday)}`}
            icon={Activity}
            color="purple"
          />
          <CockpitMetricCard
            title="Lots journal (brouillon)"
            value={payload.journalDraftCount}
            subtitle={`${payload.journalPostedCount} comptabilisé(s)`}
            icon={BookOpen}
            color="orange"
          />
          <CockpitMetricCard
            title="Créances ouvertes"
            value={payload.arOpenCount}
            subtitle="Factures AR"
            icon={FileText}
            color="blue"
          />
          <CockpitMetricCard
            title="Paiements (mois)"
            value={payload.paymentsMonthCount}
            subtitle={payload.enterpriseSource}
            icon={Landmark}
            color="green"
          />
          <CockpitMetricCard
            title="CA net du jour"
            value={formatMoneyGnf(payload.netRevenueToday)}
            subtitle="Encaissements ventes nets"
            icon={Banknote}
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
            <h2 className="text-sm font-semibold text-gray-800">Flux net — 7 derniers jours</h2>
          </div>
          <SalesChart data={payload.treasuryLast7Days} />
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
            const Icon = QUICK_ACTION_ICONS[action.id] ?? Banknote;
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
