"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions, getUserRole } from "@/lib/server/permissions";
import {
  createExpense,
  deleteExpense,
  formatExpenseError,
  setExpenseReceiptPath,
  updateExpense,
} from "@/lib/server/expenses";
import type { CreateExpenseFormInput, UpdateExpenseFormInput } from "@/lib/validations/expense";
import { revalidateFinanceScope } from "@/lib/server/revalidate-domains";
import { AUDIT_EVENT_TYPES } from "@/lib/audit/audit-events";
import { tryLogAuditEvent } from "@/lib/audit/audit-logger";
import { assertApprovalOrThrow } from "@/lib/approvals/approval-engine";

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
    const actorRole = await getUserRole(data.user.id);
    const approval = assertApprovalOrThrow({
      eventType: AUDIT_EVENT_TYPES.EXPENSE_UPDATED,
      actorUserId: data.user.id,
      actorRole,
    });
    const result = await createExpense(data.user.id, raw);
    const rawId = (result as { id?: string } | null)?.id;
    revalidateFinanceScope({ includeDashboard: true });
    await tryLogAuditEvent({
      eventType: AUDIT_EVENT_TYPES.EXPENSE_UPDATED,
      severity: "high",
      target: { table: "expenses", id: rawId ?? null },
      context: { actorUserId: data.user.id, actorRole },
      details: { operation: "create_expense" },
      approval: {
        required: approval.required,
        status: "granted",
        policy: approval.policy,
      },
    });
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
    const actorRole = await getUserRole(data.user.id);
    const approval = assertApprovalOrThrow({
      eventType: AUDIT_EVENT_TYPES.EXPENSE_UPDATED,
      actorUserId: data.user.id,
      actorRole,
    });
    await setExpenseReceiptPath(data.user.id, expenseId, storagePath);
    revalidateFinanceScope({ includeDashboard: false });
    await tryLogAuditEvent({
      eventType: AUDIT_EVENT_TYPES.EXPENSE_UPDATED,
      severity: "medium",
      target: { table: "expenses", id: expenseId },
      context: { actorUserId: data.user.id, actorRole },
      details: { operation: "attach_receipt" },
      approval: {
        required: approval.required,
        status: "granted",
        policy: approval.policy,
      },
    });
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
    const actorRole = await getUserRole(data.user.id);
    const approval = assertApprovalOrThrow({
      eventType: AUDIT_EVENT_TYPES.EXPENSE_UPDATED,
      actorUserId: data.user.id,
      actorRole,
    });
    await updateExpense(data.user.id, raw);
    revalidateFinanceScope({ includeDashboard: true });
    await tryLogAuditEvent({
      eventType: AUDIT_EVENT_TYPES.EXPENSE_UPDATED,
      severity: "high",
      target: { table: "expenses", id: raw.expenseId },
      context: { actorUserId: data.user.id, actorRole },
      details: { operation: "update_expense" },
      approval: {
        required: approval.required,
        status: "granted",
        policy: approval.policy,
      },
    });
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
    const actorRole = await getUserRole(data.user.id);
    const approval = assertApprovalOrThrow({
      eventType: AUDIT_EVENT_TYPES.EXPENSE_UPDATED,
      actorUserId: data.user.id,
      actorRole,
    });
    await deleteExpense(data.user.id, expenseId);
    revalidateFinanceScope({ includeDashboard: true });
    await tryLogAuditEvent({
      eventType: AUDIT_EVENT_TYPES.EXPENSE_UPDATED,
      severity: "critical",
      target: { table: "expenses", id: expenseId },
      context: { actorUserId: data.user.id, actorRole },
      details: { operation: "delete_expense" },
      approval: {
        required: approval.required,
        status: "granted",
        policy: approval.policy,
      },
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: formatExpenseError(err) };
  }
}
