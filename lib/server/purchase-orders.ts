import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  PO_STATUS_COLORS,
  PO_STATUS_LABELS,
  PO_STATUS_TRANSITIONS,
  type PurchaseOrderStatus,
} from "@/lib/logistique/purchase-order-shared";

export type PurchaseOrderItem = {
  id: string;
  stock_item_id: string | null;
  product_name: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_price_gnf: number;
  total_gnf: number;
};

export type PurchaseOrder = {
  id: string;
  order_number: string;
  supplier_name: string;
  supplier_contact: string | null;
  status: PurchaseOrderStatus;
  expected_delivery_date: string | null;
  received_at: string | null;
  total_gnf: number;
  notes: string | null;
  items: PurchaseOrderItem[];
  items_count: number;
  created_at: string;
  created_by: string | null;
};

export { PO_STATUS_COLORS, PO_STATUS_LABELS, PO_STATUS_TRANSITIONS };

type PurchaseOrderRow = {
  id: string;
  order_number: string;
  supplier_name: string;
  supplier_contact: string | null;
  status: PurchaseOrderStatus;
  expected_delivery_date: string | null;
  received_at: string | null;
  total_gnf: number;
  notes: string | null;
  created_at: string;
  created_by: string | null;
};

type PurchaseOrderItemRow = {
  id: string;
  stock_item_id: string | null;
  product_name: string;
  quantity_ordered: number;
  quantity_received: number | null;
  unit_price_gnf: number;
  total_gnf: number;
};

function mapItem(row: PurchaseOrderItemRow): PurchaseOrderItem {
  return {
    id: row.id,
    stock_item_id: row.stock_item_id,
    product_name: row.product_name,
    quantity_ordered: Number(row.quantity_ordered ?? 0),
    quantity_received: Number(row.quantity_received ?? 0),
    unit_price_gnf: Number(row.unit_price_gnf ?? 0),
    total_gnf: Number(row.total_gnf ?? 0),
  };
}

function mapOrder(row: PurchaseOrderRow, items: PurchaseOrderItem[] = []): PurchaseOrder {
  return {
    id: row.id,
    order_number: row.order_number,
    supplier_name: row.supplier_name,
    supplier_contact: row.supplier_contact,
    status: row.status,
    expected_delivery_date: row.expected_delivery_date,
    received_at: row.received_at,
    total_gnf: Number(row.total_gnf ?? 0),
    notes: row.notes,
    items,
    items_count: items.length,
    created_at: row.created_at,
    created_by: row.created_by,
  };
}

export async function listPurchaseOrders(params: {
  status?: string;
} = {}): Promise<{ data: PurchaseOrder[]; total: number }> {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("purchase_orders" as never)
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  const { data, error, count } = await query;
  if (error) return { data: [], total: 0 };

  const orders = (data ?? []) as PurchaseOrderRow[];
  if (orders.length === 0) return { data: [], total: 0 };

  const orderIds = orders.map((o) => o.id);
  const { data: itemsData } = await supabase
    .from("purchase_order_items" as never)
    .select("id,purchase_order_id,stock_item_id,product_name,quantity_ordered,quantity_received,unit_price_gnf,total_gnf")
    .in("purchase_order_id", orderIds);

  const byOrder = new Map<string, PurchaseOrderItem[]>();
  for (const row of (itemsData ?? []) as Array<PurchaseOrderItemRow & { purchase_order_id: string }>) {
    const bucket = byOrder.get(row.purchase_order_id) ?? [];
    bucket.push(mapItem(row));
    byOrder.set(row.purchase_order_id, bucket);
  }

  return {
    data: orders.map((o) => {
      const items = byOrder.get(o.id) ?? [];
      return mapOrder(o, items);
    }),
    total: count ?? orders.length,
  };
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
  const supabase = getSupabaseServerClient();
  const { data: order, error: orderError } = await supabase
    .from("purchase_orders" as never)
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (orderError || !order) return null;

  const { data: itemsData } = await supabase
    .from("purchase_order_items" as never)
    .select("id,stock_item_id,product_name,quantity_ordered,quantity_received,unit_price_gnf,total_gnf")
    .eq("purchase_order_id", id)
    .order("created_at", { ascending: true });

  const items = ((itemsData ?? []) as PurchaseOrderItemRow[]).map(mapItem);
  return mapOrder(order as PurchaseOrderRow, items);
}

export async function createPurchaseOrder(input: {
  supplier_name: string;
  supplier_contact?: string;
  expected_delivery_date?: string | null;
  notes?: string;
  created_by: string;
  items: {
    stock_item_id?: string | null;
    product_name: string;
    quantity_ordered: number;
    unit_price_gnf: number;
  }[];
}): Promise<{
  success: boolean;
  id?: string;
  order_number?: string;
  error?: string;
}> {
  const supabase = getSupabaseServerClient();
  const supplierName = input.supplier_name.trim();
  const items = input.items.filter((it) => it.product_name.trim() && Number(it.quantity_ordered) > 0);

  if (!supplierName) return { success: false, error: "Nom fournisseur requis." };
  if (items.length === 0) return { success: false, error: "Ajoutez au moins un article." };

  const { data: order, error: orderError } = await supabase
    .from("purchase_orders" as never)
    .insert({
      order_number: "",
      supplier_name: supplierName,
      supplier_contact: input.supplier_contact?.trim() || null,
      expected_delivery_date: input.expected_delivery_date || null,
      notes: input.notes?.trim() || null,
      created_by: input.created_by,
      status: "pending",
    } as never)
    .select("id,order_number")
    .single();

  if (orderError || !order) {
    return { success: false, error: orderError?.message ?? "Création commande impossible." };
  }

  const orderId = String((order as { id: string }).id);
  const rows = items.map((it) => ({
    purchase_order_id: orderId,
    stock_item_id: it.stock_item_id || null,
    product_name: it.product_name.trim(),
    quantity_ordered: Number(it.quantity_ordered),
    quantity_received: 0,
    unit_price_gnf: Number(it.unit_price_gnf ?? 0),
  }));

  const { error: itemsError } = await supabase
    .from("purchase_order_items" as never)
    .insert(rows as never);

  if (itemsError) {
    return { success: false, error: itemsError.message };
  }

  const total = rows.reduce((acc, row) => acc + row.quantity_ordered * row.unit_price_gnf, 0);
  await supabase
    .from("purchase_orders" as never)
    .update({ total_gnf: total, updated_at: new Date().toISOString() } as never)
    .eq("id", orderId);

  return {
    success: true,
    id: orderId,
    order_number: String((order as { order_number: string }).order_number),
  };
}

export async function updatePurchaseOrder(
  id: string,
  input: {
    supplier_name?: string;
    supplier_contact?: string;
    expected_delivery_date?: string | null;
    notes?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  const po = await getPurchaseOrderById(id);
  if (!po) return { success: false, error: "Commande introuvable." };
  if (po.status !== "pending") {
    return { success: false, error: "Seules les commandes en attente sont modifiables." };
  }

  const supabase = getSupabaseServerClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.supplier_name !== undefined) patch.supplier_name = input.supplier_name.trim();
  if (input.supplier_contact !== undefined) patch.supplier_contact = input.supplier_contact || null;
  if (input.expected_delivery_date !== undefined) patch.expected_delivery_date = input.expected_delivery_date;
  if (input.notes !== undefined) patch.notes = input.notes || null;

  const { error } = await supabase
    .from("purchase_orders" as never)
    .update(patch as never)
    .eq("id", id)
    .eq("status", "pending")
    .is("deleted_at", null);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function confirmPurchaseOrder(
  id: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const po = await getPurchaseOrderById(id);
  if (!po) return { success: false, error: "Commande introuvable." };
  if (po.status !== "pending") return { success: false, error: "Transition invalide." };

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("purchase_orders" as never)
    .update({
      status: "confirmed",
      confirmed_by: userId,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function receivePurchaseOrder(
  id: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const po = await getPurchaseOrderById(id);
  if (!po) return { success: false, error: "Commande introuvable." };
  if (po.status !== "confirmed") return { success: false, error: "Transition invalide." };

  const supabase = getSupabaseServerClient();

  for (const item of po.items) {
    if (!item.stock_item_id) continue;

    const { error: movementError } = await supabase
      .from("stock_movements_logistique" as never)
      .insert({
        item_id: item.stock_item_id,
        type: "in",
        quantity: item.quantity_ordered,
        reference: po.order_number,
        reason: `Réception commande ${po.order_number}`,
        created_by: userId,
      } as never);
    if (movementError) return { success: false, error: movementError.message };
    // Quantity is applied by trg_stock_mov_log_apply on stock_movements_logistique INSERT.
  }

  const { error } = await supabase
    .from("purchase_orders" as never)
    .update({
      status: "received",
      received_at: new Date().toISOString(),
      received_by: userId,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function cancelPurchaseOrder(id: string): Promise<{ success: boolean; error?: string }> {
  const po = await getPurchaseOrderById(id);
  if (!po) return { success: false, error: "Commande introuvable." };
  if (!["pending", "confirmed"].includes(po.status)) {
    return { success: false, error: "Seules les commandes en attente/confirmées peuvent être annulées." };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("purchase_orders" as never)
    .update({ status: "cancelled", updated_at: new Date().toISOString() } as never)
    .eq("id", id)
    .is("deleted_at", null);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deletePurchaseOrder(id: string): Promise<{ success: boolean; error?: string }> {
  const po = await getPurchaseOrderById(id);
  if (!po) return { success: false, error: "Commande introuvable." };
  if (!["pending", "cancelled"].includes(po.status)) {
    return { success: false, error: "Suppression autorisée seulement en attente ou annulée." };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("purchase_orders" as never)
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() } as never)
    .eq("id", id)
    .is("deleted_at", null);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function listStockItemsForOrder(): Promise<
  {
    id: string;
    name: string;
    sku: string | null;
    unit_price_gnf: number;
  }[]
> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("stock_items" as never)
    .select("id,name,sku,unit_price_gnf")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) return [];
  return ((data ?? []) as Array<{ id: string; name: string; sku: string | null; unit_price_gnf: number }>).map(
    (row) => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      unit_price_gnf: Number(row.unit_price_gnf ?? 0),
    }),
  );
}
