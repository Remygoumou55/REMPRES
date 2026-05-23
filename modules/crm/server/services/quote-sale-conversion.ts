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
import { CRM_APPROVAL_ENTITY_TYPES } from "@/modules/crm/constants/approval-entities";
import {
  emitCrmQuoteConvertRequested,
  emitCrmQuoteConverted,
  emitRuntimeOrchestrationFailed,
} from "@/lib/erp-core/events/integrations/crm-events";
import { recordCrmGovernanceAudit } from "@/modules/crm/server/services/crm-audit-hook";

const QUOTE_CONVERT_ORCHESTRATION = "crm.quote.convert_sale" as const;

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
  const quoteId = input.quoteId.trim();
  if (!quoteId) throw new Error("Devis invalide.");

  const supabase = getSupabaseServerClient();

  const { data: beforeQuote, error: loadErr } = await supabase
    .from("crm_quotes")
    .select("id,status,sale_id,client_id,opportunity_id,total_amount_gnf")
    .eq("id", quoteId)
    .is("deleted_at", null)
    .maybeSingle();

  if (loadErr) throw new Error(loadErr.message);
  if (!beforeQuote) throw new Error("Devis introuvable.");

  await emitCrmQuoteConvertRequested({
    actorUserId: userId,
    quoteId,
    amountGnf: Number(beforeQuote.total_amount_gnf ?? 0),
  });

  await assertCrmWriteActionAllowed(userId, CRM_WRITE_ACTIONS.QUOTE_CONVERT_SALE, "update", {
    entityType: CRM_APPROVAL_ENTITY_TYPES.quote,
    entityId: quoteId,
    amountGnf: Number(beforeQuote.total_amount_gnf ?? 0),
    reason: "Conversion devis accepté en vente",
    metadata: { payment_method: input.paymentMethod ?? "cash" },
  });
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
    const message = detail || rpcError.message;
    await emitRuntimeOrchestrationFailed({
      actorUserId: userId,
      quoteId,
      failureCode: "rpc_error",
      message,
      orchestration: QUOTE_CONVERT_ORCHESTRATION,
    });
    throw new Error(message);
  }

  const payload = rpcData as {
    quote_id?: string;
    sale_id?: string;
    sale?: { reference?: string | null; lifecycle_status?: string | null; crm_quote_id?: string | null };
  };

  const saleId = String(payload.sale_id ?? "");
  if (!saleId) {
    await emitRuntimeOrchestrationFailed({
      actorUserId: userId,
      quoteId,
      failureCode: "invalid_rpc_payload",
      message: "Réponse de conversion invalide.",
      orchestration: QUOTE_CONVERT_ORCHESTRATION,
    });
    throw new Error("Réponse de conversion invalide.");
  }

  const orchestrationCheck: QuoteSaleOrchestrationInput = {
    quoteId,
    quoteStatus: "converted",
    quoteSaleId: saleId,
    saleId,
    saleCrmQuoteId: quoteId,
    saleLifecycleStatus: payload.sale?.lifecycle_status ?? "validated",
  };
  try {
    assertQuoteSaleOrchestrationReady(orchestrationCheck);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await emitRuntimeOrchestrationFailed({
      actorUserId: userId,
      quoteId,
      failureCode: "orchestration_assert_failed",
      message,
      orchestration: QUOTE_CONVERT_ORCHESTRATION,
    });
    throw e;
  }

  await recordCrmGovernanceAudit({
    actionType: CRM_WRITE_ACTIONS.QUOTE_CONVERT_SALE,
    entityType: "crm_quotes",
    entityId: quoteId,
    beforeSnapshot: { status: beforeQuote.status, sale_id: beforeQuote.sale_id },
    afterSnapshot: { status: "converted", sale_id: saleId },
    metadata: { payment_method: paymentMethod },
  });

  await emitCrmQuoteConverted({
    actorUserId: userId,
    quoteId,
    saleId,
    saleReference: payload.sale?.reference ?? null,
  });

  return {
    quoteId,
    saleId,
    saleReference: payload.sale?.reference ?? null,
  };
}
