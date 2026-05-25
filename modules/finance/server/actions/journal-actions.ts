"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  postFinanceJournalBatch,
  rejectFinanceJournalBatchApproval,
  submitFinanceJournalBatchApproval,
} from "@/modules/finance/server/services/finance-journal-mutations";

async function requireUserId(): Promise<string> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return data.user.id;
}

export async function submitFinanceJournalApprovalAction(input: {
  batchId: string;
  reason: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const userId = await requireUserId();
  const result = await submitFinanceJournalBatchApproval(userId, input);
  if (result.success) revalidatePath("/finance/enterprise/journal");
  return result;
}

export async function postFinanceJournalBatchAction(
  batchId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const userId = await requireUserId();
  const result = await postFinanceJournalBatch(userId, batchId);
  if (result.success) revalidatePath("/finance/enterprise/journal");
  return result;
}

export async function rejectFinanceJournalBatchAction(input: {
  batchId: string;
  rejectionReason?: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const userId = await requireUserId();
  const result = await rejectFinanceJournalBatchApproval(userId, input);
  if (result.success) revalidatePath("/finance/enterprise/journal");
  return result;
}
