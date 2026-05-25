/**
 * Bloc 3 — Reporting financier opérationnel (données live, pas de mock).
 */

import { format, subDays } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  assertFinanceWriteActionAllowed,
  FINANCE_WRITE_ACTIONS,
} from "@/lib/finance/runtime/finance-write-governance";
import { emitFinanceReportGenerated } from "@/lib/erp-core/events/integrations/finance-events";
import { getFinanceCfoData, type FinanceQueryFilters } from "@/lib/server/finance-overview";
import { listFinanceTrialBalance } from "@/modules/finance/server/repositories/finance-trial-balance-repository";
import { recordFinanceGovernanceAudit } from "@/modules/finance/server/services/finance-audit-hook";
import { FINANCE_REPORT_IDS } from "@/modules/finance/reporting/report-registry";

export type FinanceOperationalReport = {
  reportId: string;
  reportType: string;
  period: { from: string; to: string };
  income: {
    totalRevenue: number;
    netSaleRevenue: number;
    profit: number;
    marginPct: number | null;
  };
  expenses: {
    total: number;
    byCategory: { name: string; amount: number; color: string }[];
  };
  cashflow: {
    netInRange: number;
    points: { date: string; net: number }[];
  };
  balanceSummary: {
    rowCount: number;
    totalDebit: number;
    totalCredit: number;
    rows: { code: string; label: string; debit: number; credit: number }[];
  };
  generatedAt: string;
};

function defaultPeriod(): { from: string; to: string } {
  const to = format(new Date(), "yyyy-MM-dd");
  const from = format(subDays(new Date(), 30), "yyyy-MM-dd");
  return { from, to };
}

export async function buildFinanceOperationalReport(
  _userId: string,
  filters?: Partial<FinanceQueryFilters>,
): Promise<FinanceOperationalReport> {
  const period = {
    from: filters?.from ?? defaultPeriod().from,
    to: filters?.to ?? defaultPeriod().to,
  };

  const queryFilters: FinanceQueryFilters = {
    from: period.from,
    to: period.to,
    categoryIds: filters?.categoryIds ?? [],
    createdByUserId: filters?.createdByUserId ?? null,
  };

  const supabase = getSupabaseServerClient();
  const [cfo, trialBalance] = await Promise.all([
    getFinanceCfoData(supabase, queryFilters),
    listFinanceTrialBalance(supabase, 200),
  ]);

  const totalDebit = trialBalance.reduce((s, r) => s + Number(r.debit_total_gnf), 0);
  const totalCredit = trialBalance.reduce((s, r) => s + Number(r.credit_total_gnf), 0);
  const netCashflow = cfo.cashflowInRange.reduce((s, p) => s + p.net, 0);

  return {
    reportId: `finance-report-${period.from}-${period.to}`,
    reportType: FINANCE_REPORT_IDS.cashflowDaily,
    period,
    income: {
      totalRevenue: cfo.totalRevenue,
      netSaleRevenue: cfo.netSaleRevenue,
      profit: cfo.profit,
      marginPct: cfo.marginPct,
    },
    expenses: {
      total: cfo.totalExpenses,
      byCategory: cfo.expensesByCategory.map((c) => ({
        name: c.name,
        amount: c.amount,
        color: c.color,
      })),
    },
    cashflow: {
      netInRange: netCashflow,
      points: cfo.cashflowInRange.map((p) => ({ date: p.date, net: p.net })),
    },
    balanceSummary: {
      rowCount: trialBalance.length,
      totalDebit,
      totalCredit,
      rows: trialBalance.slice(0, 12).map((r) => ({
        code: r.account_code,
        label: r.account_label,
        debit: Number(r.debit_total_gnf),
        credit: Number(r.credit_total_gnf),
      })),
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function generateFinanceOperationalReport(
  userId: string,
  filters?: Partial<FinanceQueryFilters>,
): Promise<{ success: true; report: FinanceOperationalReport } | { success: false; error: string }> {
  try {
    await assertFinanceWriteActionAllowed(userId, FINANCE_WRITE_ACTIONS.REPORT_GENERATE, "create");
  } catch {
    return { success: false, error: "Action non autorisee." };
  }

  const report = await buildFinanceOperationalReport(userId, filters);

  await Promise.all([
    emitFinanceReportGenerated({
      actorUserId: userId,
      reportId: report.reportId,
      reportType: report.reportType,
      periodFrom: report.period.from,
      periodTo: report.period.to,
    }),
    recordFinanceGovernanceAudit({
      actionType: FINANCE_WRITE_ACTIONS.REPORT_GENERATE,
      entityType: "finance_report",
      entityId: report.reportId,
      afterSnapshot: {
        profit: report.income.profit,
        expenses: report.expenses.total,
        balance_rows: report.balanceSummary.rowCount,
      },
    }),
  ]);

  return { success: true, report };
}
