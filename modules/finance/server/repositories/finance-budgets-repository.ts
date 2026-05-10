import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listFinanceBudgets(
  supabase: SupabaseClient<Database>,
  limit = 60,
): Promise<Database["public"]["Tables"]["finance_budgets"]["Row"][]> {
  const { data, error } = await supabase
    .from("finance_budgets")
    .select("*")
    .order("fiscal_year", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function countFinanceBudgetLinesForBudget(
  supabase: SupabaseClient<Database>,
  budgetId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("finance_budget_lines")
    .select("id", { count: "exact", head: true })
    .eq("budget_id", budgetId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
