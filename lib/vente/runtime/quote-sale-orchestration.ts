/**
 * B2.0 — Orchestration officielle devis → vente (contrat B2.2, pas d'implémentation transactionnelle).
 */

export const QUOTE_SALE_ORCHESTRATION_VERSION = "b2.0-v1" as const;

export type QuoteSaleOrchestrationInput = {
  quoteId: string;
  quoteStatus: string;
  quoteSaleId: string | null;
  saleId: string | null;
  saleCrmQuoteId: string | null;
  saleLifecycleStatus: string | null;
};

export type QuoteSaleOrchestrationPlan = {
  version: typeof QUOTE_SALE_ORCHESTRATION_VERSION;
  steps: readonly [
    "validate_quote_accepted_or_converted",
    "create_or_link_sale",
    "set_crm_quotes_sale_id",
    "set_sales_crm_quote_id",
    "set_crm_quotes_status_converted",
  ];
  rollbackOnFailure: true;
};

export const OFFICIAL_QUOTE_SALE_ORCHESTRATION_PLAN: QuoteSaleOrchestrationPlan = {
  version: QUOTE_SALE_ORCHESTRATION_VERSION,
  steps: [
    "validate_quote_accepted_or_converted",
    "create_or_link_sale",
    "set_crm_quotes_sale_id",
    "set_sales_crm_quote_id",
    "set_crm_quotes_status_converted",
  ],
  rollbackOnFailure: true,
};

export type QuoteSaleLinkValidation = {
  ok: boolean;
  errors: string[];
};

/**
 * Vérifie la cohérence des FK bidirectionnelles (B1.4 D5 / B1.5 XL-7).
 */
export function validateQuoteSaleLinkConsistency(
  input: QuoteSaleOrchestrationInput,
): QuoteSaleLinkValidation {
  const errors: string[] = [];

  if (input.quoteStatus === "converted") {
    if (!input.quoteSaleId) {
      errors.push("Devis converti sans crm_quotes.sale_id.");
    }
    if (!input.saleId) {
      errors.push("Devis converti sans vente cible.");
    }
    if (input.quoteSaleId && input.saleId && input.quoteSaleId !== input.saleId) {
      errors.push("crm_quotes.sale_id différent de sales.id.");
    }
    if (input.saleCrmQuoteId && input.saleCrmQuoteId !== input.quoteId) {
      errors.push("sales.crm_quote_id ne pointe pas vers le devis.");
    }
  }

  if (input.saleId && input.saleCrmQuoteId && input.saleCrmQuoteId !== input.quoteId) {
    errors.push("Liaison vente → devis incohérente.");
  }

  if (input.saleLifecycleStatus && input.saleLifecycleStatus !== "validated") {
    errors.push("La conversion exige une vente en lifecycle validated.");
  }

  return { ok: errors.length === 0, errors };
}

/**
 * B2.2 appellera cette porte avant toute RPC / transaction de conversion.
 */
export function assertQuoteSaleOrchestrationReady(
  input: QuoteSaleOrchestrationInput,
): void {
  const v = validateQuoteSaleLinkConsistency(input);
  if (!v.ok) {
    throw new Error(`quote_sale_orchestration:${v.errors.join("; ")}`);
  }
}
