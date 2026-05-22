/**
 * B3 — Façade runtime KPI Finance (trésorerie + enterprise).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";
import { getFinanceTreasuryKpis, FINANCE_TREASURY_KPI_SOURCE } from "@/lib/finance/runtime/finance-treasury-kpis";
import {
  getFinanceEnterpriseKpisGuarded,
  FINANCE_ENTERPRISE_KPI_SOURCE,
} from "@/lib/finance/runtime/finance-enterprise-kpis";

export const FINANCE_RUNTIME_KPI_BUNDLE_SOURCE = "finance-runtime-kpi-bundle-v1" as const;

export type FinanceRuntimeKpiBundle = {
  source: typeof FINANCE_RUNTIME_KPI_BUNDLE_SOURCE;
  generatedAt: string;
  treasury: Awaited<ReturnType<typeof getFinanceTreasuryKpis>>;
  enterprise: Awaited<ReturnType<typeof getFinanceEnterpriseKpisGuarded>>;
};

export async function getFinanceRuntimeKpiBundle(
  supabase: SupabaseClient<Database>,
  userId: string,
  now = new Date(),
): Promise<FinanceRuntimeKpiBundle> {
  const [treasury, enterprise] = await Promise.all([
    getFinanceTreasuryKpis(supabase, now),
    getFinanceEnterpriseKpisGuarded(supabase, userId),
  ]);

  return {
    source: FINANCE_RUNTIME_KPI_BUNDLE_SOURCE,
    generatedAt: now.toISOString(),
    treasury,
    enterprise,
  };
}

const FINANCE_ACTIVITY_MODULE_KEYS = ["finance", "depenses"] as const;

export async function buildDeptFinanceKpiPayload(
  supabase: SupabaseClient<Database>,
  userId: string,
  now = new Date(),
): Promise<DeptKpiPayload> {
  const bundle = await getFinanceRuntimeKpiBundle(supabase, userId, now);
  const { treasury, enterprise } = bundle;

  const recentActivityRows = await supabase
    .from("activity_logs")
    .select("id,module_key,action_key,created_at")
    .in("module_key", [...FINANCE_ACTIVITY_MODULE_KEYS])
    .order("created_at", { ascending: false })
    .limit(5);

  const alerts =
    treasury.profitMonth < 0
      ? [{ id: "negative_margin", level: "warning" as const, message: "dashboard.dept.alert.negativeMargin" }]
      : enterprise.journalDraftCount > 0
        ? [
            {
              id: "journal_drafts",
              level: "info" as const,
              message: "dashboard.dept.alert.journalDrafts",
            },
          ]
        : [];

  return {
    stats: [
      {
        id: "revenue",
        label: "dashboard.dept.kpi.totalRevenueMonth",
        value: treasury.netRevenueMonth,
        unit: "currency",
      },
      {
        id: "expenses",
        label: "dashboard.dept.kpi.totalExpensesMonth",
        value: treasury.expensesMonth,
        unit: "currency",
      },
      {
        id: "margin",
        label: "dashboard.dept.kpi.netMargin",
        value: treasury.profitMonth,
        unit: "currency",
      },
      {
        id: "transactions",
        label: "dashboard.dept.kpi.transactions",
        value: enterprise.paymentsMonthCount,
        unit: "count",
      },
    ],
    charts: [
      {
        id: "financeLast7Days",
        title: "dashboard.dept.chart.financeLast7Days",
        kind: "line",
        xKey: "x",
        series: [{ key: "net", label: "dashboard.dept.chart.netCashflow" }],
        points: treasury.treasuryLast7Days.map((d) => ({
          x: d.date,
          net: d.amount,
        })),
      },
    ],
    alerts,
    activity: (recentActivityRows.data ?? []).map((entry) => ({
      id: entry.id,
      label: entry.action_key,
      timestamp: entry.created_at,
    })),
    health: { status: "ok" },
    metadata: {
      source: `${FINANCE_TREASURY_KPI_SOURCE}+${FINANCE_ENTERPRISE_KPI_SOURCE}`,
      generatedAt: treasury.generatedAt,
      placeholder: false,
    },
  };
}
