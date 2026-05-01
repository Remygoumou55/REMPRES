/**
 * lib/server/sales.ts
 * Logique métier du module Vente : création, listing, paiement.
 *
 * Stratégie client Supabase :
 *  - getSupabaseServerClient → toutes les opérations (RLS utilisateur)
 *  - createSale utilise le RPC create_sale_transaction (SECURITY DEFINER, atomique)
 */

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { Json } from "@/types/database.types";
import {
  createSaleSchema,
  updatePaymentStatusSchema,
  saleListParamsSchema,
  type CreateSaleInput,
  type SaleListParamsInput,
} from "@/lib/validations/sale";
import { logError, logInfo } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Types internes
// ---------------------------------------------------------------------------

export type SaleItem = {
  productId: string;
  productName: string;
  productSku?: string | null;
  quantity: number;
  unitPriceGNF: number;
  discountPercent: number;
};

export type SaleTotals = {
  subtotal: number;
  discountAmount: number;
  total: number;
};

export type SaleRow = {
  id: string;
  reference: string | null;
  client_id: string | null;
  seller_id: string | null;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  total_amount_gnf: number;
  display_currency: string;
  exchange_rate: number;
  payment_method: string | null;
  payment_status: string;
  amount_paid_gnf: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SaleItemRow = {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price_gnf: number;
  discount_percent: number;
  total_price_gnf: number;
};

export type SaleWithItems = SaleRow & { items: SaleItemRow[] };

export type SaleListResult = {
  data: SaleRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type RequestContext = {
  ip?: string | null;
  userAgent?: string | null;
};

// ---------------------------------------------------------------------------
// Utilitaires internes
// ---------------------------------------------------------------------------

function normalizePagination(page?: number, pageSize?: number) {
  const safePage = Number.isInteger(page) && (page ?? 1) > 0 ? (page as number) : 1;
  const allowedPageSizes = [10, 25, 50] as const;
  const safePageSize: 10 | 25 | 50 = allowedPageSizes.includes(pageSize as 10 | 25 | 50)
    ? (pageSize as 10 | 25 | 50)
    : 10;
  return { safePage, safePageSize };
}

async function createActivityLog(params: {
  actorUserId: string;
  actionKey: "create" | "update" | "delete";
  targetId?: string;
  metadata?: Json;
}) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("activity_logs").insert({
    actor_user_id: params.actorUserId,
    module_key: "vente",
    action_key: params.actionKey,
    target_table: "sales",
    target_id: params.targetId ?? null,
    metadata: params.metadata ?? {},
  });
  if (error) {
    throw new Error(`Impossible d'écrire le journal d'activité : ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// calculateSaleTotals  (conservé pour usage interne / tests)
// ---------------------------------------------------------------------------

/**
 * Calcule les totaux d'une vente à partir des lignes et du rabais global.
 * Tous les montants sont en GNF (devise de base).
 */
export function calculateSaleTotals(
  items: SaleItem[],
  discountPercent = 0,
): SaleTotals {
  const subtotal = items.reduce((acc, item) => {
    const lineBeforeDiscount = item.unitPriceGNF * item.quantity;
    const lineDiscount = lineBeforeDiscount * (item.discountPercent / 100);
    return acc + lineBeforeDiscount - lineDiscount;
  }, 0);

  const discountAmount = Math.round(subtotal * (discountPercent / 100) * 100) / 100;
  const total = Math.round((subtotal - discountAmount) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount,
    total,
  };
}

// ---------------------------------------------------------------------------
// createSale — via RPC create_sale_transaction (SECURITY DEFINER, atomique)
// ---------------------------------------------------------------------------

/**
 * Crée une vente de façon ATOMIQUE via la fonction PostgreSQL
 * `create_sale_transaction`.
 *
 * La fonction RPC gère en une seule transaction :
 *  1. Verrouillage des lignes produit (SELECT … FOR UPDATE)
 *  2. Validation du stock disponible
 *  3. Calcul des totaux
 *  4. INSERT dans `sales` (trigger → référence VNT-YYYY-NNNN)
 *  5. INSERT dans `sale_items`
 *  6. UPDATE `products.stock_quantity`
 *  7. INSERT dans `stock_movements`
 *
 * Si n'importe quelle étape échoue, PostgreSQL annule l'intégralité
 * de la transaction (ROLLBACK implicite) → base toujours cohérente.
 */
export async function createSale(
  input: CreateSaleInput,
  userId: string,
  context?: RequestContext,
): Promise<SaleWithItems> {
  if (!userId?.trim()) {
    throw new Error("Utilisateur non authentifié");
  }
  logInfo("sales", "create sale started", { userId });

  // 1. Validation Zod côté TypeScript (avant d'atteindre la DB)
  const validated = createSaleSchema.parse(input);
  const {
    items, discountPercent, paymentMethod,
    displayCurrency, exchangeRate, notes, clientId, sellerId,
  } = validated;

  const supabase = getSupabaseServerClient();

  // 2. Appel RPC — toute la logique transactionnelle est dans la DB
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "create_sale_transaction",
    {
      p_seller_id:        sellerId,
      p_created_by:       userId,
      p_client_id:        clientId,
      p_items:            items.map((i) => ({
        product_id:       i.productId,
        product_name:     i.productName,
        product_sku:      i.productSku ?? null,
        quantity:         i.quantity,
        unit_price_gnf:   i.unitPriceGNF,
        discount_percent: i.discountPercent,
      })),
      p_discount_percent: discountPercent,
      p_payment_method:   paymentMethod,
      p_display_currency: displayCurrency,
      p_exchange_rate:    exchangeRate,
      p_notes:            notes ?? null,
    },
  );

  if (rpcError) {
    // Les erreurs métier de la fonction ont un message structuré (ex: "INSUFFICIENT_STOCK")
    // On les transmet directement pour un affichage utilisateur lisible
    const detail = (rpcError as { details?: string }).details ?? rpcError.message;
    logError("sales", "create sale rpc failed", {
      userId,
      detail,
      code: rpcError.code,
      hint: rpcError.hint,
    });
    throw new Error(detail || rpcError.message);
  }

  // 3. Extraction du résultat JSONB → types TypeScript
  // La RPC renvoie aussi status, sale_id, total_amount_gnf (STEP 6 — atomicité côté DB).
  const result = rpcResult as {
    sale: Record<string, unknown>;
    items?: Record<string, unknown>[];
    status?: string;
    sale_id?: string;
    total_amount_gnf?: number;
  };

  if (!result?.sale) {
    logError("sales", "create sale invalid rpc response", { userId, rpcResult });
    throw new Error("Réponse inattendue du serveur lors de la création de la vente.");
  }

  const saleRow = result.sale as unknown as SaleRow;
  const itemRows = (result.items ?? []) as unknown as SaleItemRow[];

  // 4. Log d'activité (silencieux — ne doit jamais bloquer la vente)
  try {
    await createActivityLog({
      actorUserId: userId,
      actionKey:   "create",
      targetId:    saleRow.id,
      metadata: {
        before: null,
        after: {
          reference:        saleRow.reference,
          total_amount_gnf: saleRow.total_amount_gnf,
          items_count:      itemRows.length,
          payment_method:   paymentMethod,
          display_currency: displayCurrency,
        },
        context: {
          ip:        context?.ip ?? null,
          userAgent: context?.userAgent ?? null,
        },
      },
    });
  } catch (activityLogError) {
    logError("sales", "[ActivityLog] Failed to log sale create", { userId, error: activityLogError });
  }

  logInfo("sales", "create sale success", {
    userId,
    saleId: saleRow.id,
    totalAmountGnf: saleRow.total_amount_gnf,
  });

  return { ...saleRow, items: itemRows };
}

// ---------------------------------------------------------------------------
// listSales
// ---------------------------------------------------------------------------

const SALE_COLUMNS =
  "id,reference,client_id,seller_id,subtotal,discount_percent,discount_amount," +
  "total_amount_gnf,display_currency,exchange_rate,payment_method,payment_status," +
  "amount_paid_gnf,notes,created_by,created_at,updated_at,deleted_at";

/**
 * Liste paginée des ventes actives avec filtres.
 * Recherche sur `reference` et nom du client (via jointure sur `clients`).
 */
export async function listSales(rawParams: SaleListParamsInput = {}): Promise<SaleListResult> {
  const params = saleListParamsSchema.parse(rawParams);
  const { safePage, safePageSize } = normalizePagination(params.page, params.pageSize);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  const supabase = getSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from("sales")
    .select(SALE_COLUMNS, { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.paymentStatus) {
    query = query.eq("payment_status", params.paymentStatus);
  }
  if (params.from) {
    query = query.gte("created_at", params.from);
  }
  if (params.to) {
    query = query.lte("created_at", params.to);
  }
  if (params.search?.trim()) {
    const s = params.search.trim().replace(/,/g, "\\,");
    // Recherche sur la référence uniquement (nom client nécessiterait une jointure RPC)
    query = query.ilike("reference", `%${s}%`);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    throw new Error(`Impossible de charger la liste des ventes : ${error.message}`);
  }

  const total = count ?? 0;
  const totalPages = total === 0 ? 1 : Math.ceil(total / safePageSize);

  return {
    data: (data ?? []) as SaleRow[],
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}

// ---------------------------------------------------------------------------
// getSaleById
// ---------------------------------------------------------------------------

/** Récupère une vente avec toutes ses lignes. Retourne null si introuvable. */
export async function getSaleById(id: string): Promise<SaleWithItems | null> {
  if (!id?.trim()) {
    throw new Error("Identifiant de vente invalide");
  }

  const supabase = getSupabaseServerClient();

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .select(SALE_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (saleError) {
    throw new Error(`Impossible de récupérer la vente : ${saleError.message}`);
  }
  if (!sale) return null;

  const { data: items, error: itemsError } = await supabase
    .from("sale_items")
    .select("*")
    .eq("sale_id", id)
    .order("id", { ascending: true });

  if (itemsError) {
    throw new Error(`Impossible de récupérer les articles de la vente : ${itemsError.message}`);
  }

  return {
    ...(sale as unknown as SaleRow),
    items: (items ?? []) as SaleItemRow[],
  };
}

// ---------------------------------------------------------------------------
// updatePaymentStatus
// ---------------------------------------------------------------------------

/**
 * Met à jour le statut de paiement et le montant encaissé d'une vente.
 * Déduit automatiquement `paid` si `amountPaid >= total_amount_gnf` et que
 * le statut demandé est `partial`.
 */
export async function updatePaymentStatus(
  saleId: string,
  newStatus: "pending" | "partial" | "paid" | "overdue" | "cancelled",
  amountPaid: number,
  userId: string,
  context?: RequestContext,
): Promise<SaleRow> {
  const validated = updatePaymentStatusSchema.parse({ saleId, newStatus, amountPaid });

  const supabase = getSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("sales")
    .select(SALE_COLUMNS)
    .eq("id", validated.saleId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Impossible de récupérer la vente : ${fetchError.message}`);
  }
  if (!existing) {
    throw new Error("Vente introuvable");
  }

  const existingSale = existing as unknown as SaleRow;

  // Promotion automatique vers "paid" si le montant couvre le total
  let finalStatus = validated.newStatus;
  if (finalStatus === "partial" && validated.amountPaid >= existingSale.total_amount_gnf) {
    finalStatus = "paid";
  }

  const { data: updated, error: updateError } = await supabase
    .from("sales")
    .update({
      payment_status: finalStatus,
      amount_paid_gnf: validated.amountPaid,
    })
    .eq("id", validated.saleId)
    .is("deleted_at", null)
    .select(SALE_COLUMNS)
    .single();

  if (updateError || !updated) {
    throw new Error(`Impossible de mettre à jour le statut de paiement : ${updateError?.message}`);
  }

  try {
    await createActivityLog({
      actorUserId: userId,
      actionKey: "update",
      targetId: validated.saleId,
      metadata: {
        before: {
          payment_status: existingSale.payment_status,
          amount_paid_gnf: existingSale.amount_paid_gnf,
        },
        after: {
          payment_status: finalStatus,
          amount_paid_gnf: validated.amountPaid,
        },
        context: {
          ip: context?.ip ?? null,
          userAgent: context?.userAgent ?? null,
        },
      },
    });
  } catch (activityLogError) {
    logError("sales", "[ActivityLog] Failed to log payment status update", {
      userId,
      saleId: validated.saleId,
      error: activityLogError,
    });
  }

  return updated as unknown as SaleRow;
}
