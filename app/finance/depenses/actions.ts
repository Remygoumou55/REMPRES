"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions } from "@/lib/server/permissions";
import {
  createExpense,
  deleteExpense,
  formatExpenseError,
  setExpenseReceiptPath,
  updateExpense,
} from "@/lib/server/expenses";
import type { CreateExpenseFormInput, UpdateExpenseFormInput } from "@/lib/validations/expense";

export async function createExpenseAction(
  raw: CreateExpenseFormInput,
): Promise<{ success: true; expenseId?: string } | { success: false; error: string }> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const perms = await getModulePermissions(data.user.id, ["finance"]);
  if (!perms.canCreate) {
    return { success: false, error: "Vous n'avez pas l'autorisation d'enregistrer une dépense." };
  }

  try {
    const result = await createExpense(data.user.id, raw);
    const rawId = (result as { id?: string } | null)?.id;
    revalidatePath("/finance/depenses");
    return { success: true, expenseId: rawId };
  } catch (err) {
    return { success: false, error: formatExpenseError(err) };
  }
}

export async function attachExpenseReceiptAction(
  expenseId: string,
  storagePath: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const perms = await getModulePermissions(data.user.id, ["finance"]);
  if (!perms.canCreate && !perms.canUpdate) {
    return { success: false, error: "Action non autorisée." };
  }

  try {
    await setExpenseReceiptPath(data.user.id, expenseId, storagePath);
    revalidatePath("/finance/depenses");
    return { success: true };
  } catch (err) {
    return { success: false, error: formatExpenseError(err) };
  }
}

export async function updateExpenseAction(
  raw: UpdateExpenseFormInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const perms = await getModulePermissions(data.user.id, ["finance"]);
  if (!perms.canUpdate) {
    return { success: false, error: "Modification non autorisée." };
  }

  try {
    await updateExpense(data.user.id, raw);
    revalidatePath("/finance/depenses");
    return { success: true };
  } catch (err) {
    return { success: false, error: formatExpenseError(err) };
  }
}

export async function deleteExpenseAction(
  expenseId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const perms = await getModulePermissions(data.user.id, ["finance"]);
  if (!perms.canDelete) {
    return { success: false, error: "Suppression non autorisée." };
  }

  try {
    await deleteExpense(data.user.id, expenseId);
    revalidatePath("/finance/depenses");
    return { success: true };
  } catch (err) {
    return { success: false, error: formatExpenseError(err) };
  }
}
