// ============================================
// Quotes (Devis) — Server Service
// RemPres ERP
// ============================================

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { createSale } from "@/lib/server/sales";
import { logError } from "@/lib/logger";

// ─── Types ────────────────────────────────────

export type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "refused"
  | "expired"
  | "converted";

export type QuoteItem = {
  id: string;
  quote_id: string;
  product_id: string | null;
  product_name: string;
  description: string | null;
  quantity: number;
  unit_price_gnf: number;
  discount_pct: number;
  line_total_gnf: number;
  position: number;
};

export type Quote = {
  id: string;
  quote_number: string;
  client_id: string | null;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  status: QuoteStatus;
  valid_until: string | null;
  subtotal_gnf: number;
  discount_gnf: number;
  total_gnf: number;
  converted_to_sale_id: string | null;
  converted_at: string | null;
  notes: string | null;
  payment_conditions: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  refused_at: string | null;
  refused_reason: string | null;
  created_by: string | null;
  created_at: string;
  items: QuoteItem[];
  items_count: number;
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  refused: "Refusé",
  expired: "Expiré",
  converted: "Converti en vente",
};

export const QUOTE_STATUS_COLORS: Record<
  QuoteStatus,
  { bg: string; text: string }
> = {
  draft: { bg: "#F1EFE8", text: "#444441" },
  sent: { bg: "#E6F1FB", text: "#0C447C" },
  accepted: { bg: "#EAF3DE", text: "#27500A" },
  refused: { bg: "#FCEBEB", text: "#791F1F" },
  expired: { bg: "#FAEEDA", text: "#633806" },
  converted: { bg: "#EEEDFE", text: "#3C3489" },
};

export const QUOTE_STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ["sent", "accepted", "refused"],
  sent: ["accepted", "refused", "expired"],
  accepted: ["converted"],
  refused: [],
  expired: [],
  converted: [],
};

export type CreateQuoteInput = {
  client_id?: string | null;
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  valid_until?: string | null;
  notes?: string | null;
  payment_conditions?: string | null;
  created_by: string;
  items: {
    product_id?: string | null;
    product_name: string;
    description?: string | null;
    quantity: number;
    unit_price_gnf: number;
    discount_pct?: number;
    position?: number;
  }[];
};

type QuoteRow = {
  id: string;
  quote_number: string;
  client_id: string | null;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  status: QuoteStatus;
  valid_until: string | null;
  subtotal_gnf: number;
  discount_gnf: number;
  total_gnf: number;
  converted_to_sale_id: string | null;
  converted_at: string | null;
  notes: string | null;
  payment_conditions: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  refused_at: string | null;
  refused_reason: string | null;
  created_by: string | null;
  created_at: string;
  quote_items?: Array<{ count: number }>;
};

type QuoteItemRow = {
  id: string;
  quote_id: string;
  product_id: string | null;
  product_name: string;
  description: string | null;
  quantity: number;
  unit_price_gnf: number;
  discount_pct: number;
  line_total_gnf: number;
  position: number;
};

const EMPTY_STATS: Record<QuoteStatus, number> = {
  draft: 0,
  sent: 0,
  accepted: 0,
  refused: 0,
  expired: 0,
  converted: 0,
};

function mapItem(row: QuoteItemRow): QuoteItem {
  return {
    id: row.id,
    quote_id: row.quote_id,
    product_id: row.product_id,
    product_name: row.product_name,
    description: row.description,
    quantity: Number(row.quantity ?? 0),
    unit_price_gnf: Number(row.unit_price_gnf ?? 0),
    discount_pct: Number(row.discount_pct ?? 0),
    line_total_gnf: Number(row.line_total_gnf ?? 0),
    position: Number(row.position ?? 0),
  };
}

function mapQuoteRow(
  row: QuoteRow,
  items: QuoteItem[] = [],
  itemsCountOverride?: number,
): Quote {
  return {
    id: row.id,
    quote_number: row.quote_number,
    client_id: row.client_id,
    client_name: row.client_name,
    client_email: row.client_email,
    client_phone: row.client_phone,
    status: row.status,
    valid_until: row.valid_until,
    subtotal_gnf: Number(row.subtotal_gnf ?? 0),
    discount_gnf: Number(row.discount_gnf ?? 0),
    total_gnf: Number(row.total_gnf ?? 0),
    converted_to_sale_id: row.converted_to_sale_id,
    converted_at: row.converted_at,
    notes: row.notes,
    payment_conditions: row.payment_conditions,
    sent_at: row.sent_at,
    accepted_at: row.accepted_at,
    refused_at: row.refused_at,
    refused_reason: row.refused_reason,
    created_by: row.created_by,
    created_at: row.created_at,
    items,
    items_count: itemsCountOverride ?? items.length,
  };
}

async function fetchQuoteItems(quoteId: string): Promise<QuoteItem[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("quote_items" as never)
    .select(
      "id,quote_id,product_id,product_name,description,quantity,unit_price_gnf,discount_pct,line_total_gnf,position",
    )
    .eq("quote_id", quoteId)
    .order("position", { ascending: true });

  return ((data ?? []) as QuoteItemRow[]).map(mapItem);
}

async function recomputeQuoteTotals(
  quoteId: string,
  discountGnf = 0,
): Promise<{ subtotal: number; total: number }> {
  const supabase = getSupabaseServerClient();
  const { data: items } = await supabase
    .from("quote_items" as never)
    .select("line_total_gnf")
    .eq("quote_id", quoteId);

  const subtotal = ((items ?? []) as Array<{ line_total_gnf: number }>).reduce(
    (acc, row) => acc + Number(row.line_total_gnf ?? 0),
    0,
  );
  const discount = Number(discountGnf ?? 0);
  const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  await supabase
    .from("quotes" as never)
    .update({
      subtotal_gnf: subtotal,
      discount_gnf: discount,
      total_gnf: total,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", quoteId);

  return { subtotal, total };
}

function buildItemRows(
  quoteId: string,
  items: CreateQuoteInput["items"],
): Array<Record<string, unknown>> {
  return items
    .filter((it) => it.product_name.trim() && Number(it.quantity) > 0)
    .map((it, index) => ({
      quote_id: quoteId,
      product_id: it.product_id || null,
      product_name: it.product_name.trim(),
      description: it.description?.trim() || null,
      quantity: Number(it.quantity),
      unit_price_gnf: Number(it.unit_price_gnf ?? 0),
      discount_pct: Number(it.discount_pct ?? 0),
      position: it.position ?? index,
    }));
}

// ─── FUNCTIONS ────────────────────────────────

export async function listQuotes(params?: {
  status?: QuoteStatus;
  client_id?: string;
  search?: string;
  limit?: number;
}): Promise<{
  data: Quote[];
  total: number;
  stats: Record<QuoteStatus, number>;
}> {
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from("quotes" as never)
    .select("*, quote_items(count)", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params?.status) {
    query = query.eq("status", params.status);
  }
  if (params?.client_id) {
    query = query.eq("client_id", params.client_id);
  }
  if (params?.search?.trim()) {
    const term = params.search.trim().replace(/,/g, "\\,");
    query = query.or(
      `client_name.ilike.%${term}%,quote_number.ilike.%${term}%`,
    );
  }
  if (params?.limit) {
    query = query.limit(params.limit);
  }

  const { data, count, error } = await query;
  if (error) {
    return { data: [], total: 0, stats: { ...EMPTY_STATS } };
  }

  const stats = { ...EMPTY_STATS };
  for (const row of (data ?? []) as QuoteRow[]) {
    if (row.status in stats) {
      stats[row.status as QuoteStatus]++;
    }
  }

  return {
    data: ((data ?? []) as QuoteRow[]).map((row) =>
      mapQuoteRow(row, [], row.quote_items?.[0]?.count ?? 0),
    ),
    total: count ?? 0,
    stats,
  };
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  const supabase = getSupabaseServerClient();
  const { data: quote, error } = await supabase
    .from("quotes" as never)
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !quote) return null;

  const items = await fetchQuoteItems(id);
  return mapQuoteRow(quote as QuoteRow, items);
}

export async function createQuote(
  input: CreateQuoteInput,
): Promise<{
  success: boolean;
  id?: string;
  quote_number?: string;
  error?: string;
}> {
  const supabase = getSupabaseServerClient();
  const clientName = input.client_name.trim();
  const validItems = input.items.filter(
    (it) => it.product_name.trim() && Number(it.quantity) > 0,
  );

  if (!clientName) {
    return { success: false, error: "Le nom du client est obligatoire." };
  }
  if (validItems.length === 0) {
    return { success: false, error: "Ajoutez au moins une ligne au devis." };
  }

  const { data: quote, error: quoteError } = await supabase
    .from("quotes" as never)
    .insert({
      quote_number: "",
      client_id: input.client_id || null,
      client_name: clientName,
      client_email: input.client_email?.trim() || null,
      client_phone: input.client_phone?.trim() || null,
      valid_until: input.valid_until || null,
      notes: input.notes?.trim() || null,
      payment_conditions:
        input.payment_conditions?.trim() || "Paiement à 30 jours",
      created_by: input.created_by,
      status: "draft",
    } as never)
    .select("id,quote_number")
    .single();

  if (quoteError || !quote) {
    return {
      success: false,
      error: quoteError?.message ?? "Création du devis impossible.",
    };
  }

  const quoteId = String((quote as { id: string }).id);
  const itemRows = buildItemRows(quoteId, input.items);

  const { error: itemsError } = await supabase
    .from("quote_items" as never)
    .insert(itemRows as never);

  if (itemsError) {
    return { success: false, error: itemsError.message };
  }

  await recomputeQuoteTotals(quoteId, 0);

  return {
    success: true,
    id: quoteId,
    quote_number: String((quote as { quote_number: string }).quote_number),
  };
}

export async function updateQuote(
  id: string,
  input: Partial<Omit<CreateQuoteInput, "created_by">>,
): Promise<{ success: boolean; error?: string }> {
  const current = await getQuoteById(id);
  if (!current) return { success: false, error: "Devis introuvable." };
  if (current.status !== "draft") {
    return {
      success: false,
      error: "Seuls les devis en brouillon peuvent être modifiés.",
    };
  }

  const supabase = getSupabaseServerClient();
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.client_id !== undefined) patch.client_id = input.client_id || null;
  if (input.client_name !== undefined) {
    const name = input.client_name.trim();
    if (!name) return { success: false, error: "Le nom du client est obligatoire." };
    patch.client_name = name;
  }
  if (input.client_email !== undefined) {
    patch.client_email = input.client_email?.trim() || null;
  }
  if (input.client_phone !== undefined) {
    patch.client_phone = input.client_phone?.trim() || null;
  }
  if (input.valid_until !== undefined) patch.valid_until = input.valid_until || null;
  if (input.notes !== undefined) patch.notes = input.notes?.trim() || null;
  if (input.payment_conditions !== undefined) {
    patch.payment_conditions = input.payment_conditions?.trim() || null;
  }

  const { error: updateError } = await supabase
    .from("quotes" as never)
    .update(patch as never)
    .eq("id", id)
    .eq("status", "draft")
    .is("deleted_at", null);

  if (updateError) return { success: false, error: updateError.message };

  if (input.items) {
    const itemRows = buildItemRows(id, input.items);
    if (itemRows.length === 0) {
      return { success: false, error: "Ajoutez au moins une ligne au devis." };
    }

    const { error: deleteError } = await supabase
      .from("quote_items" as never)
      .delete()
      .eq("quote_id", id);

    if (deleteError) return { success: false, error: deleteError.message };

    const { error: insertError } = await supabase
      .from("quote_items" as never)
      .insert(itemRows as never);

    if (insertError) return { success: false, error: insertError.message };

    await recomputeQuoteTotals(id, current.discount_gnf);
  }

  return { success: true };
}

export async function sendQuote(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const quote = await getQuoteById(id);
  if (!quote) return { success: false, error: "Devis introuvable." };
  if (quote.status !== "draft") {
    return { success: false, error: "Seuls les devis en brouillon peuvent être envoyés." };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("quotes" as never)
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id)
    .eq("status", "draft")
    .is("deleted_at", null);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function acceptQuote(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const quote = await getQuoteById(id);
  if (!quote) return { success: false, error: "Devis introuvable." };
  if (quote.status !== "sent") {
    return { success: false, error: "Seul un devis envoyé peut être accepté." };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("quotes" as never)
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id)
    .eq("status", "sent")
    .is("deleted_at", null);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function refuseQuote(
  id: string,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  const quote = await getQuoteById(id);
  if (!quote) return { success: false, error: "Devis introuvable." };
  if (!["draft", "sent"].includes(quote.status)) {
    return {
      success: false,
      error: "Seuls les devis en brouillon ou envoyés peuvent être refusés.",
    };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("quotes" as never)
    .update({
      status: "refused",
      refused_at: new Date().toISOString(),
      refused_reason: reason?.trim() || null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id)
    .in("status", ["draft", "sent"])
    .is("deleted_at", null);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function expireQuote(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const quote = await getQuoteById(id);
  if (!quote) return { success: false, error: "Devis introuvable." };
  if (quote.status !== "sent") {
    return { success: false, error: "Seul un devis envoyé peut expirer." };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("quotes" as never)
    .update({
      status: "expired",
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id)
    .eq("status", "sent")
    .is("deleted_at", null);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function convertQuoteToSale(
  quoteId: string,
  userId: string,
): Promise<{
  success: boolean;
  saleId?: string;
  error?: string;
}> {
  const quote = await getQuoteById(quoteId);
  if (!quote) {
    return { success: false, error: "Devis introuvable." };
  }
  if (quote.status !== "accepted") {
    return {
      success: false,
      error: `Le devis doit être accepté avant conversion. Statut actuel: ${quote.status}`,
    };
  }
  if (quote.converted_to_sale_id) {
    return {
      success: false,
      error: `Ce devis a déjà été converti (vente: ${quote.converted_to_sale_id})`,
    };
  }
  if (!quote.client_id) {
    return {
      success: false,
      error:
        "Un client enregistré est requis pour convertir ce devis en vente.",
    };
  }
  if (quote.items.length === 0) {
    return { success: false, error: "Le devis ne contient aucune ligne." };
  }

  const missingProduct = quote.items.find((item) => !item.product_id);
  if (missingProduct) {
    return {
      success: false,
      error:
        "Chaque ligne doit référencer un produit du catalogue pour la conversion (gestion du stock).",
    };
  }

  const supabase = getSupabaseServerClient();
  const productIds = quote.items.map((item) => item.product_id as string);
  const { data: products } = await supabase
    .from("products")
    .select("id,sku")
    .in("id", productIds);

  const skuByProductId = new Map<string, string | null>();
  for (const product of (products ?? []) as Array<{ id: string; sku: string | null }>) {
    skuByProductId.set(product.id, product.sku);
  }

  const globalDiscountPercent =
    quote.subtotal_gnf > 0
      ? Math.round((quote.discount_gnf / quote.subtotal_gnf) * 10000) / 100
      : 0;

  const notesParts = [`Converti depuis devis ${quote.quote_number}`];
  if (quote.notes?.trim()) notesParts.push(quote.notes.trim());

  let saleId: string;

  try {
    const sale = await createSale(
      {
        clientId: quote.client_id,
        sellerId: userId,
        items: quote.items.map((item) => ({
          productId: item.product_id as string,
          productName: item.product_name,
          productSku: skuByProductId.get(item.product_id as string) ?? null,
          quantity: item.quantity,
          unitPriceGNF: item.unit_price_gnf,
          discountPercent: item.discount_pct,
        })),
        discountPercent: globalDiscountPercent,
        paymentMethod: "cash",
        displayCurrency: "GNF",
        exchangeRate: 1,
        notes: notesParts.join("\n"),
      },
      userId,
    );
    saleId = sale.id;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Création de la vente impossible.";
    return { success: false, error: message };
  }

  const { error: quoteUpdateError } = await supabase
    .from("quotes" as never)
    .update({
      status: "converted",
      converted_to_sale_id: saleId,
      converted_at: new Date().toISOString(),
      converted_by: userId,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", quoteId)
    .eq("status", "accepted")
    .is("deleted_at", null);

  if (quoteUpdateError) {
    logError("quotes", "quote converted but status update failed", {
      quoteId,
      saleId,
      userId,
      error: quoteUpdateError.message,
    });
  }

  return { success: true, saleId };
}

export async function deleteQuote(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const quote = await getQuoteById(id);
  if (!quote) return { success: false, error: "Devis introuvable." };
  if (!["draft", "refused"].includes(quote.status)) {
    return {
      success: false,
      error: "Seuls les devis en brouillon ou refusés peuvent être supprimés.",
    };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("quotes" as never)
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function listClientQuotes(clientId: string): Promise<Quote[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("quotes" as never)
    .select("*, quote_items(count)")
    .eq("client_id", clientId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return [];

  return ((data ?? []) as QuoteRow[]).map((row) =>
    mapQuoteRow(row, [], row.quote_items?.[0]?.count ?? 0),
  );
}
