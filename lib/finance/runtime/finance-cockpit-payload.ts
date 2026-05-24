/**
 * B3 — Contrat payload B2.4 (référence tests / gouvernance).
 * Runtime cockpit dept = DeptHomePage + getDeptDashboardData sur `/dept/finance`.
 * Surface opérationnelle CFO = FinanceDashboardClient sur `/finance` (cockpit-authority).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { RecentActivityEntry } from "@/lib/server/dashboard-kpis";
import type { DayStats } from "@/lib/vente/runtime/sale-kpi-aggregates";
import { getFinanceRuntimeKpiBundle } from "@/lib/finance/runtime/finance-kpi-runtime";
import { FINANCE_TREASURY_KPI_SOURCE } from "@/lib/finance/runtime/finance-treasury-kpis";
import { FINANCE_ENTERPRISE_KPI_SOURCE } from "@/lib/finance/runtime/finance-enterprise-kpis";

export const FINANCE_COCKPIT_PAYLOAD_SOURCE = "finance-cockpit-runtime-v1" as const;

export type FinanceCockpitAlertLevel = "critical" | "warning" | "info";

export type FinanceCockpitAlert = {
  id: string;
  level: FinanceCockpitAlertLevel;
  message: string;
  href: string;
};

export type FinanceCockpitQuickAction = {
  id: string;
  label: string;
  description: string;
  href: string;
};

export const OFFICIAL_FINANCE_COCKPIT_QUICK_ACTIONS: readonly FinanceCockpitQuickAction[] = [
  { id: "cfo", label: "Pilotage CFO", description: "Vue trésorerie et filtres", href: "/finance" },
  { id: "expenses", label: "Dépenses", description: "Suivi des dépenses", href: "/finance/depenses" },
  { id: "enterprise", label: "Comptabilité", description: "Hub enterprise", href: "/finance/enterprise" },
  { id: "treasury", label: "Trésorerie", description: "Positions et flux", href: "/finance/enterprise/tresorerie" },
  { id: "invoicing", label: "Facturation", description: "Créances clients", href: "/finance/enterprise/facturation" },
  { id: "reporting", label: "Reporting", description: "Rapports financiers", href: "/finance/enterprise/reporting" },
] as const;

export type FinanceCockpitPayload = {
  source: typeof FINANCE_COCKPIT_PAYLOAD_SOURCE;
  generatedAt: string;
  userDisplayName: string;
  treasurySource: typeof FINANCE_TREASURY_KPI_SOURCE;
  enterpriseSource: typeof FINANCE_ENTERPRISE_KPI_SOURCE;
  netRevenueToday: number;
  netRevenueMonth: number;
  expensesMonth: number;
  profitMonth: number;
  marginPctMonth: number | null;
  expensesToday: number;
  profitToday: number;
  journalDraftCount: number;
  journalPostedCount: number;
  arOpenCount: number;
  paymentsMonthCount: number;
  treasuryLast7Days: DayStats[];
  alerts: FinanceCockpitAlert[];
  recentActivity: RecentActivityEntry[];
  quickActions: readonly FinanceCockpitQuickAction[];
};

const FINANCE_ACTIVITY_MODULE_KEYS = ["finance", "depenses"] as const;

async function fetchFinanceCommercialActivity(
  supabase: SupabaseClient<Database>,
  limit = 12,
): Promise<RecentActivityEntry[]> {
  const { data: recentLogs, error } = await supabase
    .from("activity_logs")
    .select("id, action_key, module_key, created_at, actor_user_id")
    .in("module_key", [...FINANCE_ACTIVITY_MODULE_KEYS])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const actorIds = Array.from(
    new Set((recentLogs ?? []).map((l) => l.actor_user_id).filter((id): id is string => Boolean(id))),
  );

  const actorNames: Record<string, string> = {};
  if (actorIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", actorIds);
    for (const p of profiles ?? []) {
      const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
      if (name) actorNames[p.id] = name;
    }
  }

  return (recentLogs ?? []).map((l) => ({
    id: l.id,
    action_key: l.action_key,
    module_key: l.module_key,
    actor_display_name: l.actor_user_id ? (actorNames[l.actor_user_id] ?? null) : null,
    created_at: l.created_at,
  }));
}

function buildFinanceCockpitAlerts(input: {
  profitMonth: number;
  journalDraftCount: number;
  arOpenCount: number;
}): FinanceCockpitAlert[] {
  const alerts: FinanceCockpitAlert[] = [];

  if (input.profitMonth < 0) {
    alerts.push({
      id: "negative_margin",
      level: "critical",
      message: "Résultat net du mois négatif — revoir dépenses et encaissements",
      href: "/finance",
    });
  }

  if (input.journalDraftCount > 0) {
    alerts.push({
      id: "journal_drafts",
      level: "warning",
      message: `${input.journalDraftCount} lot(s) journal en brouillon à comptabiliser`,
      href: "/finance/enterprise/journal",
    });
  }

  if (input.arOpenCount > 0) {
    alerts.push({
      id: "ar_open",
      level: input.arOpenCount >= 10 ? "warning" : "info",
      message: `${input.arOpenCount} facture(s) client en cours`,
      href: "/finance/enterprise/facturation",
    });
  }

  return alerts.slice(0, 8);
}

export async function getFinanceCockpitPayload(
  supabase: SupabaseClient<Database>,
  userId: string,
  userDisplayName: string,
  now = new Date(),
): Promise<FinanceCockpitPayload> {
  const [bundle, recentActivity] = await Promise.all([
    getFinanceRuntimeKpiBundle(supabase, userId, now),
    fetchFinanceCommercialActivity(supabase),
  ]);

  const { treasury, enterprise } = bundle;

  const alerts = buildFinanceCockpitAlerts({
    profitMonth: treasury.profitMonth,
    journalDraftCount: enterprise.journalDraftCount,
    arOpenCount: enterprise.arOpenCount,
  });

  return {
    source: FINANCE_COCKPIT_PAYLOAD_SOURCE,
    generatedAt: bundle.generatedAt,
    userDisplayName,
    treasurySource: treasury.source,
    enterpriseSource: enterprise.source,
    netRevenueToday: treasury.netRevenueToday,
    netRevenueMonth: treasury.netRevenueMonth,
    expensesMonth: treasury.expensesMonth,
    profitMonth: treasury.profitMonth,
    marginPctMonth: treasury.marginPctMonth,
    expensesToday: treasury.expensesToday,
    profitToday: treasury.profitToday,
    journalDraftCount: enterprise.journalDraftCount,
    journalPostedCount: enterprise.journalPostedCount,
    arOpenCount: enterprise.arOpenCount,
    paymentsMonthCount: enterprise.paymentsMonthCount,
    treasuryLast7Days: treasury.treasuryLast7Days,
    alerts,
    recentActivity,
    quickActions: OFFICIAL_FINANCE_COCKPIT_QUICK_ACTIONS,
  };
}
