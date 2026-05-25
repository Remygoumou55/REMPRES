/**
 * Bloc 3 — Émission bus pour financial_transactions (lecture SoT, pas de double write).
 */

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  emitFinancePaymentRecorded,
  emitFinanceTransactionRecorded,
  emitFinanceTransactionUpdated,
} from "@/lib/erp-core/events/integrations/finance-events";

export async function emitFinanceTransactionForExpense(
  actorUserId: string,
  expenseId: string,
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("financial_transactions")
    .select("id,source_type,source_id,amount_gnf,status")
    .eq("source_type", "expense")
    .eq("source_id", expenseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.id) return;

  await emitFinanceTransactionRecorded({
    actorUserId,
    transactionId: data.id,
    sourceType: data.source_type,
    sourceId: data.source_id,
    amountGnf: Number(data.amount_gnf),
    status: data.status,
  });
}

export async function emitFinanceTransactionForJournalBatch(
  actorUserId: string,
  batchId: string,
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data: lines } = await supabase
    .from("finance_journal_lines")
    .select("amount_gnf,debit_credit")
    .eq("batch_id", batchId);

  const totalDebit =
    lines?.reduce((sum, line) => sum + (line.debit_credit === "D" ? Number(line.amount_gnf) : 0), 0) ?? 0;

  await emitFinanceTransactionRecorded({
    actorUserId,
    transactionId: batchId,
    sourceType: "journal_batch",
    sourceId: batchId,
    amountGnf: totalDebit,
    status: "posted",
  });
}

export async function emitFinancePaymentFromAllocation(
  actorUserId: string,
  paymentId: string,
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("finance_payment_allocations")
    .select("id,amount_gnf,payment_method")
    .eq("id", paymentId)
    .maybeSingle();

  if (!data?.id) return;

  await emitFinancePaymentRecorded({
    actorUserId,
    paymentId: data.id,
    amountGnf: Number(data.amount_gnf),
    direction: data.payment_method,
  });
}

export async function emitFinanceTransactionUpdatedForExpense(
  actorUserId: string,
  expenseId: string,
  _fromAmountGnf: number | null,
  toAmountGnf: number,
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("financial_transactions")
    .select("id,status,amount_gnf")
    .eq("source_type", "expense")
    .eq("source_id", expenseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.id) {
    await emitFinanceTransactionForExpense(actorUserId, expenseId);
    return;
  }

  await emitFinanceTransactionUpdated({
    actorUserId,
    transactionId: data.id,
    fromStatus: data.status,
    toStatus: data.status,
    amountGnf: toAmountGnf,
  });
}
