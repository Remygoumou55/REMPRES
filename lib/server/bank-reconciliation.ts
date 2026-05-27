/**
 * Rapprochement bancaire — solde système vs relevé bancaire.
 */
import {
  periodLabel,
  type BankReconciliation,
  type BankReconciliationStatus,
} from "@/lib/finance/bank-reconciliation-types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export type {
  BankReconciliation,
  BankReconciliationStatus,
  DiscrepancyLevel,
} from "@/lib/finance/bank-reconciliation-types";
export {
  FR_MONTHS,
  getDiscrepancyColor,
  getDiscrepancyLevel,
  periodLabel,
} from "@/lib/finance/bank-reconciliation-types";

type SaleRow = {
  total_amount_gnf: number | null;
  lifecycle_status: string | null;
  payment_status: string | null;
};

type ExpenseRow = { amount_gnf: number | null };

type FtRow = {
  amount_gnf: number | null;
  source_type: string | null;
  status: string | null;
};

function isValidatedSale(s: SaleRow): boolean {
  if (s.lifecycle_status === "validated") return true;
  const ps = s.payment_status;
  return ps === "paid" || ps === "partial";
}

function ytdBounds(year: number, month: number): {
  startISO: string;
  endISO: string;
  startDate: string;
  endDate: string;
} {
  const start = new Date(year, 0, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    startDate: `${year}-01-01`,
    endDate: `${year}-${pad(month)}-${pad(end.getDate())}`,
  };
}

function normalizeRow(row: Record<string, unknown>): BankReconciliation {
  const month = Number(row.month);
  const year = Number(row.year);
  return {
    id: String(row.id),
    month,
    year,
    period_label: periodLabel(month, year),
    system_balance_gnf: Math.round(Number(row.system_balance_gnf ?? 0)),
    bank_balance_gnf:
      row.bank_balance_gnf != null
        ? Math.round(Number(row.bank_balance_gnf))
        : null,
    discrepancy_gnf:
      row.discrepancy_gnf != null
        ? Math.round(Number(row.discrepancy_gnf))
        : null,
    status: (row.status as BankReconciliationStatus) ?? "draft",
    notes: row.notes != null ? String(row.notes) : null,
    validated_at: row.validated_at != null ? String(row.validated_at) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

/** Solde cumulé année → fin du mois (revenus − dépenses). */
export async function computeSystemBalance(
  month: number,
  year: number,
): Promise<number> {
  const supabase = getSupabaseServerClient();
  const { startISO, endISO, startDate, endDate } = ytdBounds(year, month);

  const [salesRes, expensesRes, ftRes] = await Promise.all([
    supabase
      .from("sales")
      .select("total_amount_gnf, lifecycle_status, payment_status")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .is("deleted_at", null),
    supabase
      .from("expenses")
      .select("amount_gnf")
      .gte("expense_date", startDate)
      .lte("expense_date", endDate)
      .is("deleted_at", null),
    supabase
      .from("financial_transactions")
      .select("amount_gnf, source_type, status")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .in("source_type", ["training", "consultation"]),
  ]);

  const sales = (salesRes.data ?? []) as SaleRow[];
  const expenses = (expensesRes.data ?? []) as ExpenseRow[];
  const ft = (ftRes.data ?? []) as FtRow[];

  const salesRevenue = sales
    .filter(isValidatedSale)
    .reduce((sum, s) => sum + Number(s.total_amount_gnf ?? 0), 0);

  const otherRevenue = ft
    .filter((t) => t.status !== "cancelled")
    .reduce((sum, t) => sum + Number(t.amount_gnf ?? 0), 0);

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + Number(e.amount_gnf ?? 0),
    0,
  );

  return Math.round(salesRevenue + otherRevenue - totalExpenses);
}

export async function getReconciliationById(
  id: string,
): Promise<BankReconciliation | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("bank_reconciliations" as never)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeRow(data as Record<string, unknown>);
}

export async function getOrCreateReconciliation(
  month: number,
  year: number,
  userId: string,
): Promise<BankReconciliation> {
  const supabase = getSupabaseServerClient();

  const { data: existing } = await supabase
    .from("bank_reconciliations" as never)
    .select("*")
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (existing) {
    return normalizeRow(existing as Record<string, unknown>);
  }

  const systemBalance = await computeSystemBalance(month, year);

  const { data: created, error } = await supabase
    .from("bank_reconciliations" as never)
    .insert({
      month,
      year,
      system_balance_gnf: systemBalance,
      status: "draft",
      created_by: userId,
    } as never)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: retry } = await supabase
        .from("bank_reconciliations" as never)
        .select("*")
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();
      if (retry) return normalizeRow(retry as Record<string, unknown>);
    }
    throw new Error(error.message);
  }

  return normalizeRow(created as Record<string, unknown>);
}

export async function listReconciliations(
  limit = 12,
): Promise<BankReconciliation[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("bank_reconciliations" as never)
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) =>
    normalizeRow(row as Record<string, unknown>),
  );
}

export async function updateBankBalance(input: {
  id: string;
  bank_balance_gnf: number;
  notes?: string;
  status?: BankReconciliationStatus;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();

  const current = await getReconciliationById(input.id);
  if (!current) return { success: false, error: "Rapprochement introuvable." };
  if (current.status === "validated") {
    return { success: false, error: "Rapprochement déjà validé." };
  }

  const nextStatus: BankReconciliationStatus =
    input.status ??
    (current.status === "draft" ? "in_progress" : current.status);

  const { error } = await supabase
    .from("bank_reconciliations" as never)
    .update({
      bank_balance_gnf: input.bank_balance_gnf,
      notes: input.notes ?? current.notes,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", input.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function validateReconciliation(input: {
  id: string;
  userId: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const current = await getReconciliationById(input.id);
  if (!current) return { success: false, error: "Rapprochement introuvable." };
  if (current.status === "validated") {
    return { success: false, error: "Déjà validé." };
  }
  if (current.bank_balance_gnf == null) {
    return {
      success: false,
      error: "Saisissez le solde bancaire avant validation.",
    };
  }

  const { error } = await supabase
    .from("bank_reconciliations" as never)
    .update({
      status: "validated",
      validated_at: new Date().toISOString(),
      validated_by: input.userId,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", input.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
