/**
 * P4.1 — Mutations dépenses gouvernées : gate → write → publisher → audit.
 */

import {
  assertFinanceWriteActionAllowed,
  FINANCE_WRITE_ACTIONS,
} from "@/lib/finance/runtime/finance-write-governance";
import {
  emitFinanceExpenseCreated,
  emitFinanceExpenseUpdated,
} from "@/lib/erp-core/events/integrations/finance-events";
import { createExpense, updateExpense } from "@/lib/server/expenses";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { recordFinanceGovernanceAudit } from "@/modules/finance/server/services/finance-audit-hook";
import type {
  CreateExpenseFormInput,
  UpdateExpenseFormInput,
} from "@/lib/validations/expense";

async function resolveCategoryName(categoryId: string): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("expense_categories")
    .select("name")
    .eq("id", categoryId)
    .maybeSingle();
  return data?.name != null ? String(data.name) : null;
}

function resolveExpenseId(result: { id?: string } | null, fallbackId?: string): string {
  const id = result?.id ?? fallbackId;
  if (!id?.trim()) {
    throw new Error("finance:expense_id_missing_after_write");
  }
  return id;
}

export async function createFinanceExpense(userId: string, input: CreateExpenseFormInput) {
  await assertFinanceWriteActionAllowed(userId, FINANCE_WRITE_ACTIONS.EXPENSE_CREATE, "create");

  const result = await createExpense(userId, input);
  const expenseId = resolveExpenseId(result as { id?: string } | null);
  const categoryName = await resolveCategoryName(input.categoryId);

  await Promise.all([
    emitFinanceExpenseCreated({
      actorUserId: userId,
      expenseId,
      amountGnf: input.amountGnf,
      categoryId: input.categoryId,
      categoryName,
    }),
    recordFinanceGovernanceAudit({
      actionType: FINANCE_WRITE_ACTIONS.EXPENSE_CREATE,
      entityType: "expenses",
      entityId: expenseId,
      afterSnapshot: {
        id: expenseId,
        amount_gnf: input.amountGnf,
        category_id: input.categoryId,
        expense_date: input.expenseDate,
      },
    }),
  ]);

  return { id: expenseId, ...(result as object) };
}

export async function updateFinanceExpense(userId: string, input: UpdateExpenseFormInput) {
  await assertFinanceWriteActionAllowed(userId, FINANCE_WRITE_ACTIONS.EXPENSE_UPDATE, "update");

  const supabase = getSupabaseServerClient();
  const { data: before } = await supabase
    .from("expenses")
    .select("id, amount_gnf, category_id, expense_date, payment_method")
    .eq("id", input.expenseId)
    .is("deleted_at", null)
    .maybeSingle();

  const result = await updateExpense(userId, input);
  const expenseId = resolveExpenseId(result as { id?: string } | null, input.expenseId);
  const categoryName = await resolveCategoryName(input.categoryId);

  await Promise.all([
    emitFinanceExpenseUpdated({
      actorUserId: userId,
      expenseId,
      amountGnf: input.amountGnf,
      categoryId: input.categoryId,
      fromAmountGnf: before?.amount_gnf != null ? Number(before.amount_gnf) : null,
      categoryName,
    }),
    recordFinanceGovernanceAudit({
      actionType: FINANCE_WRITE_ACTIONS.EXPENSE_UPDATE,
      entityType: "expenses",
      entityId: expenseId,
      beforeSnapshot: before ?? null,
      afterSnapshot: {
        id: expenseId,
        amount_gnf: input.amountGnf,
        category_id: input.categoryId,
        expense_date: input.expenseDate,
      },
    }),
  ]);

  return result;
}
