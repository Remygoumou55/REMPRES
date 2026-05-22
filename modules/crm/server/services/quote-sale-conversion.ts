/**
 * B2.2 — Orchestration devis → vente (RPC atomique + validation B2.0).
 */

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  CRM_WRITE_ACTIONS,
  assertCrmWriteActionAllowed,
} from "@/lib/vente/runtime/crm-write-governance";
import {
  assertQuoteSaleOrchestrationReady,
  type QuoteSaleOrchestrationInput,
} from "@/lib/vente/runtime/quote-sale-orchestration";
import { recordCrmGovernanceAudit } from "@/modules/crm/server/services/crm-audit-hook";

export type ConvertCrmQuoteToSaleInput = {
  quoteId: string;
  paymentMethod?: "cash" | "mobile_money" | "bank_transfer";
  notes?: string | null;
};

export type ConvertCrmQuoteToSaleResult = {
  quoteId: string;
  saleId: string;
  saleReference: string | null;
};

export async function convertCrmQuoteToSale(
  userId: string,
  input: ConvertCrmQuoteToSaleInput,
): Promise<ConvertCrmQuoteToSaleResult> {
  await assertCrmWriteActionAllowed(userId, CRM_WRITE_ACTIONS.QUOTE_CONVERT_SALE, "update");

  const quoteId = input.quoteId.trim();
  if (!quoteId) throw new Error("Devis invalide.");

  const supabase = getSupabaseServerClient();

  const { data: beforeQuote, error: loadErr } = await supabase
    .from("crm_quotes")
    .select("id,status,sale_id,client_id,opportunity_id")
    .eq("id", quoteId)
    .is("deleted_at", null)
    .maybeSingle();

  if (loadErr) throw new Error(loadErr.message);
  if (!beforeQuote) throw new Error("Devis introuvable.");
  if (beforeQuote.status !== "accepted") {
    throw new Error("Seuls les devis au statut « accepted » peuvent être convertis en vente.");
  }
  if (beforeQuote.sale_id) {
    throw new Error("Ce devis est déjà converti.");
  }

  const paymentMethod = input.paymentMethod ?? "cash";
  const { data: rpcData, error: rpcError } = await supabase.rpc("convert_crm_quote_to_sale", {
    p_quote_id: quoteId,
    p_seller_id: userId,
    p_created_by: userId,
    p_payment_method: paymentMethod,
    p_notes: input.notes ?? null,
  });

  if (rpcError) {
    const detail = (rpcError as { details?: string }).details ?? rpcError.message;
    throw new Error(detail || rpcError.message);
  }

  const payload = rpcData as {
    quote_id?: string;
    sale_id?: string;
    sale?: { reference?: string | null; lifecycle_status?: string | null; crm_quote_id?: string | null };
  };

  const saleId = String(payload.sale_id ?? "");
  if (!saleId) throw new Error("Réponse de conversion invalide.");

  const orchestrationCheck: QuoteSaleOrchestrationInput = {
    quoteId,
    quoteStatus: "converted",
    quoteSaleId: saleId,
    saleId,
    saleCrmQuoteId: quoteId,
    saleLifecycleStatus: payload.sale?.lifecycle_status ?? "validated",
  };
  assertQuoteSaleOrchestrationReady(orchestrationCheck);

  await recordCrmGovernanceAudit({
    actionType: CRM_WRITE_ACTIONS.QUOTE_CONVERT_SALE,
    entityType: "crm_quotes",
    entityId: quoteId,
    beforeSnapshot: { status: beforeQuote.status, sale_id: beforeQuote.sale_id },
    afterSnapshot: { status: "converted", sale_id: saleId },
    metadata: { payment_method: paymentMethod },
  });

  return {
    quoteId,
    saleId,
    saleReference: payload.sale?.reference ?? null,
  };
}
