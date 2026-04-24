/**
 * Dépenses — lecture agrégée + CRUD via RPC (atomique, journal, financial_transactions).
 * Montant canonique : amount_gnf (GNF).
 */
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { insertActivityLog } from "@/lib/server/insert-activity-log";
import { logError } from "@/lib/logger";
import {
  createExpenseFormSchema,
  updateExpenseFormSchema,
  type CreateExpenseFormInput,
  type UpdateExpenseFormInput,
} from "@/lib/validations/expense";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExpenseCategoryRow = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
};

export type ExpenseListRow = {
  id: string;
  category_id: string;
  description: string;
  amount_gnf: number;
  payment_method: string | null;
  expense_date: string;
  created_at: string;
  created_by: string | null;
  receipt_url: string | null;
  category_name: string;
  category_color: string;
};

export type ExpenseListResult = {
  data: ExpenseListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ExpenseStats = {
  totalInRange: number;
  totalToday: number;
  totalMonth: number;
  byCategory: { categoryId: string; name: string; color: string; total: number }[];
};

// ---------------------------------------------------------------------------
// Catégories (référentiel)
// ---------------------------------------------------------------------------

export async function listExpenseCategories(): Promise<ExpenseCategoryRow[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("expense_categories")
    .select("id, name, color, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Catégories indisponibles : ${error.message}`);
  }
  return (data ?? []) as ExpenseCategoryRow[];
}

// ---------------------------------------------------------------------------
// Liste paginée
// ---------------------------------------------------------------------------

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfMonthIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export type ListExpensesParams = {
  page?: number;
  pageSize?: 10 | 25 | 50;
  from?: string;
  to?: string;
  categoryId?: string;
};

export async function listExpenses(
  params: ListExpensesParams = {},
): Promise<ExpenseListResult> {
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize: 10 | 25 | 50 = [10, 25, 50].includes(params.pageSize as number)
    ? (params.pageSize as 10 | 25 | 50)
    : 25;
  const from = params.from || firstDayOfMonthIso();
  const to = params.to || todayIsoDate();

  const supabase = getSupabaseServerClient();
  const catMap = new Map(
    (await listExpenseCategories()).map((c) => [c.id, c] as const),
  );

  let q = supabase
    .from("expenses")
    .select(
      "id, category_id, description, amount_gnf, payment_method, expense_date, created_at, created_by, receipt_url",
      { count: "exact" },
    )
    .is("deleted_at", null)
    .gte("expense_date", from)
    .lte("expense_date", to)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (params.categoryId) {
    q = q.eq("category_id", params.categoryId);
  }

  const fromIdx = (page - 1) * pageSize;
  const toIdx = fromIdx + pageSize - 1;
  const { data, count, error } = await q.range(fromIdx, toIdx);

  if (error) {
    throw new Error(`Dépenses indisponibles : ${error.message}`);
  }

  const rows: ExpenseListRow[] = (data ?? []).map((r) => {
    const c = catMap.get(r.category_id);
    return {
      ...r,
      category_name: c?.name ?? "—",
      category_color: c?.color ?? "#64748B",
    };
  });

  const total = count ?? 0;
  const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);
  return { data: rows, total, page, pageSize, totalPages };
}

// ---------------------------------------------------------------------------
// Statistiques
// ---------------------------------------------------------------------------

export async function getExpenseStats(filters: { from: string; to: string; categoryId?: string }): Promise<ExpenseStats> {
  const supabase = getSupabaseServerClient();
  const categories = await listExpenseCategories();
  const catById = new Map(categories.map((c) => [c.id, c] as const));

  let q = supabase
    .from("expenses")
    .select("category_id, amount_gnf, expense_date")
    .is("deleted_at", null)
    .gte("expense_date", filters.from)
    .lte("expense_date", filters.to);

  if (filters.categoryId) {
    q = q.eq("category_id", filters.categoryId);
  }

  const { data, error } = await q;

  if (error) {
    throw new Error(`Stats dépenses : ${error.message}`);
  }

  const filtered = data ?? [];

  const totalInRange = filtered.reduce((a, r) => a + Number(r.amount_gnf), 0);
  const tday = todayIsoDate();
  const totalToday = filtered
    .filter((r) => r.expense_date === tday)
    .reduce((a, r) => a + Number(r.amount_gnf), 0);

  const monthKey = (filters.to || tday).slice(0, 7);
  const totalMonth = filtered
    .filter((r) => r.expense_date.slice(0, 7) === monthKey)
    .reduce((a, r) => a + Number(r.amount_gnf), 0);

  const byCat = new Map<string, number>();
  for (const r of filtered) {
    byCat.set(r.category_id, (byCat.get(r.category_id) ?? 0) + Number(r.amount_gnf));
  }
  const byCategory = Array.from(byCat.entries())
    .map(([categoryId, tot]) => {
      const c = catById.get(categoryId);
      return { categoryId, name: c?.name ?? "—", color: c?.color ?? "#64748B", total: tot };
    })
    .sort((a, b) => b.total - a.total);

  return { totalInRange, totalToday, totalMonth, byCategory };
}

// ---------------------------------------------------------------------------
// createExpense (RPC)
// ---------------------------------------------------------------------------

export async function createExpense(userId: string, input: CreateExpenseFormInput) {
  const parsed = createExpenseFormSchema.parse(input);
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.rpc("create_expense_transaction", {
    p_user_id: userId,
    p_category_id: parsed.categoryId,
    p_amount_gnf: parsed.amountGnf,
    p_description: parsed.description,
    p_expense_date: parsed.expenseDate,
    p_payment_method: parsed.paymentMethod,
    p_receipt_url: null,
  });

  if (error) {
    throw new Error(error.message || (error as { details?: string }).details || "Impossible d’enregistrer la dépense");
  }

  return data as { id?: string; summary?: string } | null;
}

// ---------------------------------------------------------------------------
// setReceiptPath — mise à jour directe (après upload Storage)
// ---------------------------------------------------------------------------

export async function setExpenseReceiptPath(
  userId: string,
  expenseId: string,
  path: string | null,
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("expenses")
    .update({ receipt_url: path, updated_at: new Date().toISOString() })
    .eq("id", expenseId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  try {
    await insertActivityLog({
      actorUserId: userId,
      moduleKey: "depenses",
      actionKey: "update",
      targetTable: "expenses",
      targetId: expenseId,
      metadata: {
        summary: path ? "Justificatif attaché / mis à jour" : "Justificatif retiré",
        receipt_update: true,
      },
    });
  } catch (e) {
    logError("EXPENSE_RECEIPT_ACTIVITY_LOG", e, { expenseId, userId });
  }
}

// ---------------------------------------------------------------------------
// update / delete (RPC)
// ---------------------------------------------------------------------------

export async function updateExpense(userId: string, input: UpdateExpenseFormInput) {
  const parsed = updateExpenseFormSchema.parse(input);
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.rpc("update_expense_transaction", {
    p_expense_id: parsed.expenseId,
    p_user_id: userId,
    p_category_id: parsed.categoryId,
    p_amount_gnf: parsed.amountGnf,
    p_description: parsed.description,
    p_expense_date: parsed.expenseDate,
    p_payment_method: parsed.paymentMethod,
    p_receipt_url: parsed.receiptPath !== undefined ? parsed.receiptPath : null,
  });

  if (error) {
    throw new Error(error.message || "Impossible de modifier la dépense");
  }
  return data as { id?: string; summary?: string } | null;
}

export async function deleteExpense(userId: string, expenseId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.rpc("delete_expense_transaction", {
    p_expense_id: expenseId,
    p_user_id: userId,
  });
  if (error) {
    throw new Error(error.message || "Impossible de supprimer la dépense");
  }
  return data as { id?: string; summary?: string } | null;
}

export function formatExpenseError(err: unknown): string {
  if (err instanceof z.ZodError) {
    return err.issues[0]?.message ?? "Données invalides";
  }
  if (err instanceof Error) return err.message;
  return "Erreur inattendue";
}
