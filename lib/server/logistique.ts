import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getRecentActivity } from "@/lib/server/get-recent-activity";
import { getDeptActivityModuleKeys } from "@/lib/dept/dashboard-module-keys";
import { safeCount, safeRows } from "@/lib/utils/safe-query";
import type {
  CreatePurchaseOrderInput,
  CreateStockItemInput,
  CreateSupplierInput,
  PurchaseOrder,
  PurchaseOrderStatus,
  RecordStockMovementInput,
  StockItem,
  StockMovement,
  Supplier,
  UpdateStockItemInput,
  UpdateSupplierInput,
} from "@/lib/types/logistique";
import type { ActivityItem } from "@/components/dashboard/activity-feed";
import type { AlertItem, ChartPoint } from "@/lib/server/dept-dashboard";

/**
 * Logistique supply — source de vérité : `stock_items` + `stock_movements_logistique`.
 *
 * Ne pas confondre avec `logistics_inventory_balances` (stock multi-sites lié au
 * catalogue vente `products`, voir `modules/logistics/server/repositories/logistics-stock-repository.ts`).
 * Audit : docs/DUPLICATE_TABLES_AUDIT.md § Paire 2.
 */

type ListStockItemsParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: "normal" | "low" | "out" | "all";
};

type ListMovementsParams = {
  itemId?: string;
  type?: "in" | "out" | "adjust" | "transfer" | "all";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

type ListSuppliersParams = {
  search?: string;
  status?: "active" | "inactive" | "all";
  page?: number;
  pageSize?: number;
};

type ListPurchaseOrdersParams = {
  status?: string;
  supplierId?: string;
  page?: number;
  pageSize?: number;
};

function sevenDaysAgoIso(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

function startOfMonthIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

// ═══════════════════════════════════════════════════════════════════════════
// STOCK ITEMS
// ═══════════════════════════════════════════════════════════════════════════

export async function listStockItems(
  params: ListStockItemsParams = {},
): Promise<{ data: StockItem[]; total: number; lowCount: number; outCount: number; totalValue: number }> {
  const supabase = getSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const limit = params.limit ?? 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("stock_items" as never)
    .select(
      "*,warehouse:logistics_warehouses(code,label)",
      { count: "exact" },
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.category && params.category !== "all") {
    query = query.eq("category", params.category);
  }
  if (params.search?.trim()) {
    const s = params.search.trim().replace(/,/g, "\\,");
    query = query.or(
      `name.ilike.%${s}%,sku.ilike.%${s}%,category.ilike.%${s}%,description.ilike.%${s}%`,
    );
  }

  const result = await query.range(from, to);
  const data = (result.error ? [] : (result.data ?? [])) as StockItem[];
  const total = result.error ? 0 : result.count ?? 0;

  // Filter by stock status after fetch (DB-side requires expression)
  let filtered = data;
  if (params.status === "low") {
    filtered = data.filter((i) => Number(i.quantity) > 0 && Number(i.quantity) <= Number(i.min_quantity));
  } else if (params.status === "out") {
    filtered = data.filter((i) => Number(i.quantity) <= 0);
  } else if (params.status === "normal") {
    filtered = data.filter((i) => Number(i.quantity) > Number(i.min_quantity));
  }

  // Compute aggregate stats from the full (paginated) set
  let lowCount = 0;
  let outCount = 0;
  let totalValue = 0;
  for (const i of data) {
    const qty = Number(i.quantity ?? 0);
    const min = Number(i.min_quantity ?? 0);
    const price = Number(i.unit_price_gnf ?? 0);
    if (qty <= 0) outCount++;
    else if (qty <= min) lowCount++;
    totalValue += qty * price;
  }

  return { data: filtered, total, lowCount, outCount, totalValue };
}

export async function getStockItemById(id: string): Promise<StockItem | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("stock_items" as never)
    .select("*,warehouse:logistics_warehouses(code,label)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) return null;
  return (data as StockItem | null) ?? null;
}

export async function listStockItemCategories(): Promise<string[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("stock_items" as never)
    .select("category")
    .is("deleted_at", null);
  const set = new Set<string>();
  ((data ?? []) as Array<{ category: string | null }>).forEach((row) => {
    const c = (row.category ?? "").trim();
    if (c) set.add(c);
  });
  return Array.from(set).sort();
}

export async function listStockItemsForSelect(): Promise<
  { id: string; label: string; unit: string; quantity: number }[]
> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("stock_items" as never)
    .select("id,name,sku,unit,quantity")
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .limit(500);
  return ((data ?? []) as Array<{
    id: string;
    name: string;
    sku: string | null;
    unit: string;
    quantity: number;
  }>).map((row) => ({
    id: row.id,
    label: row.sku ? `${row.sku} — ${row.name}` : row.name,
    unit: row.unit,
    quantity: Number(row.quantity ?? 0),
  }));
}

export async function listWarehousesForSelect(): Promise<
  { id: string; label: string; code: string }[]
> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("logistics_warehouses" as never)
    .select("id,code,label,is_active")
    .order("label", { ascending: true });
  return ((data ?? []) as Array<{
    id: string;
    code: string;
    label: string;
    is_active: boolean;
  }>)
    .filter((r) => r.is_active !== false)
    .map((r) => ({ id: r.id, code: r.code, label: r.label }));
}

export async function createStockItem(
  input: CreateStockItemInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  const name = String(input.name ?? "").trim();
  const unit = String(input.unit ?? "").trim();
  if (!name || !unit) {
    return { success: false, error: "Le nom et l'unité sont obligatoires." };
  }

  const { data, error } = await supabase
    .from("stock_items" as never)
    .insert({
      name,
      sku: input.sku?.trim() || null,
      category: input.category?.trim() || null,
      unit,
      quantity: Number(input.quantity ?? 0) || 0,
      min_quantity: Number(input.min_quantity ?? 0) || 0,
      unit_price_gnf: Number(input.unit_price_gnf ?? 0) || 0,
      warehouse_id: input.warehouse_id || null,
      description: input.description?.trim() || null,
      created_by: input.created_by ?? null,
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Échec de création." };
  }
  return { success: true, id: String((data as { id: string }).id) };
}

export async function updateStockItem(
  id: string,
  input: UpdateStockItemInput,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.sku !== undefined) patch.sku = input.sku || null;
  if (input.category !== undefined) patch.category = input.category || null;
  if (input.unit !== undefined) patch.unit = input.unit;
  if (input.quantity !== undefined) patch.quantity = Number(input.quantity) || 0;
  if (input.min_quantity !== undefined) patch.min_quantity = Number(input.min_quantity) || 0;
  if (input.unit_price_gnf !== undefined) patch.unit_price_gnf = Number(input.unit_price_gnf) || 0;
  if (input.warehouse_id !== undefined) patch.warehouse_id = input.warehouse_id || null;
  if (input.description !== undefined) patch.description = input.description || null;

  const { error } = await supabase
    .from("stock_items" as never)
    .update(patch as never)
    .eq("id", id)
    .is("deleted_at", null);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function softDeleteStockItem(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("stock_items" as never)
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// STOCK MOVEMENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function listStockMovements(
  params: ListMovementsParams = {},
): Promise<{ data: StockMovement[]; total: number }> {
  const supabase = getSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 100;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("stock_movements_logistique" as never)
    .select(
      "*,item:stock_items(name,sku,unit)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (params.itemId) query = query.eq("item_id", params.itemId);
  if (params.type && params.type !== "all") query = query.eq("type", params.type);
  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo);

  const result = await query.range(from, to);
  if (result.error) return { data: [], total: 0 };
  return {
    data: (result.data ?? []) as StockMovement[],
    total: result.count ?? 0,
  };
}

export async function recordStockMovement(
  input: RecordStockMovementInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  const itemId = String(input.item_id ?? "").trim();
  const qty = Number(input.quantity ?? 0);
  if (!itemId || !input.type) {
    return { success: false, error: "Article et type requis." };
  }
  if (qty <= 0) {
    return { success: false, error: "La quantité doit être positive." };
  }
  if (input.type === "transfer" && (!input.warehouse_from || !input.warehouse_to)) {
    return {
      success: false,
      error: "Les entrepôts source et destination sont requis pour un transfert.",
    };
  }

  const { data, error } = await supabase
    .from("stock_movements_logistique" as never)
    .insert({
      item_id: itemId,
      type: input.type,
      quantity: qty,
      reason: input.reason?.trim() || null,
      reference: input.reference?.trim() || null,
      warehouse_from: input.warehouse_from || null,
      warehouse_to: input.warehouse_to || null,
      created_by: input.created_by ?? null,
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Échec d'enregistrement." };
  }
  return { success: true, id: String((data as { id: string }).id) };
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPPLIERS  (mapped to logistics_suppliers)
// ═══════════════════════════════════════════════════════════════════════════

type SupplierRow = {
  id: string;
  supplier_code: string;
  company_name: string;
  contact_email: string | null;
  phone: string | null;
  address: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function mapSupplier(row: SupplierRow): Supplier {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  const addrJson = (row.address ?? {}) as Record<string, unknown>;
  const addrStr =
    typeof addrJson.line === "string"
      ? (addrJson.line as string)
      : typeof addrJson.text === "string"
        ? (addrJson.text as string)
        : "";
  return {
    id: row.id,
    name: row.company_name,
    contact_name: (meta.contact_name as string | undefined) ?? null,
    email: row.contact_email,
    phone: row.phone,
    address: addrStr || null,
    category: (meta.category as string | undefined) ?? null,
    is_active: row.is_active,
    supplier_code: row.supplier_code,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function buildSupplierCode(name: string): string {
  const slug = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 6);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${slug || "SUP"}-${suffix}`;
}

export async function listSuppliers(
  params: ListSuppliersParams = {},
): Promise<{ data: Supplier[]; total: number }> {
  const supabase = getSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("logistics_suppliers" as never)
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (params.status === "active") query = query.eq("is_active", true);
  else if (params.status === "inactive") query = query.eq("is_active", false);

  if (params.search?.trim()) {
    const s = params.search.trim().replace(/,/g, "\\,");
    query = query.or(
      `company_name.ilike.%${s}%,supplier_code.ilike.%${s}%,contact_email.ilike.%${s}%,phone.ilike.%${s}%`,
    );
  }

  const result = await query.range(from, to);
  if (result.error) return { data: [], total: 0 };
  const rows = (result.data ?? []) as SupplierRow[];
  return { data: rows.map(mapSupplier), total: result.count ?? 0 };
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("logistics_suppliers" as never)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapSupplier(data as SupplierRow);
}

export async function listSuppliersForSelect(): Promise<
  { id: string; label: string }[]
> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("logistics_suppliers" as never)
    .select("id,company_name,supplier_code,is_active")
    .order("company_name", { ascending: true })
    .limit(500);
  return ((data ?? []) as Array<{
    id: string;
    company_name: string;
    supplier_code: string;
    is_active: boolean;
  }>)
    .filter((r) => r.is_active)
    .map((r) => ({ id: r.id, label: `${r.company_name} (${r.supplier_code})` }));
}

export async function createSupplier(
  input: CreateSupplierInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  const name = String(input.name ?? "").trim();
  if (!name) return { success: false, error: "Le nom est obligatoire." };

  const supplierCode = buildSupplierCode(name);
  const metadata: Record<string, unknown> = {};
  if (input.contact_name) metadata.contact_name = input.contact_name;
  if (input.category) metadata.category = input.category;
  const address = input.address ? { line: input.address } : {};

  const { data, error } = await supabase
    .from("logistics_suppliers" as never)
    .insert({
      supplier_code: supplierCode,
      company_name: name,
      contact_email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      address,
      metadata,
      is_active: input.is_active ?? true,
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Échec de création." };
  }
  return { success: true, id: String((data as { id: string }).id) };
}

export async function updateSupplier(
  id: string,
  input: UpdateSupplierInput,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const supplier = await getSupplierById(id);
  if (!supplier) return { success: false, error: "Fournisseur introuvable." };

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.company_name = input.name;
  if (input.email !== undefined) patch.contact_email = input.email || null;
  if (input.phone !== undefined) patch.phone = input.phone || null;
  if (input.is_active !== undefined) patch.is_active = input.is_active;
  if (input.address !== undefined) {
    patch.address = input.address ? { line: input.address } : {};
  }

  if (input.contact_name !== undefined || input.category !== undefined) {
    const meta: Record<string, unknown> = {
      contact_name:
        input.contact_name !== undefined ? input.contact_name : supplier.contact_name,
      category: input.category !== undefined ? input.category : supplier.category,
    };
    patch.metadata = meta;
  }

  const { error } = await supabase
    .from("logistics_suppliers" as never)
    .update(patch as never)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function setSupplierActive(
  id: string,
  active: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("logistics_suppliers" as never)
    .update({ is_active: active } as never)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// PURCHASE ORDERS (simple_purchase_orders)
// ═══════════════════════════════════════════════════════════════════════════

export async function listPurchaseOrders(
  params: ListPurchaseOrdersParams = {},
): Promise<{ data: PurchaseOrder[]; total: number }> {
  const supabase = getSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("simple_purchase_orders" as never)
    .select(
      "*,supplier:logistics_suppliers(company_name,supplier_code)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") query = query.eq("status", params.status);
  if (params.supplierId) query = query.eq("supplier_id", params.supplierId);

  const result = await query.range(from, to);
  if (result.error) return { data: [], total: 0 };
  return {
    data: (result.data ?? []) as PurchaseOrder[],
    total: result.count ?? 0,
  };
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("simple_purchase_orders" as never)
    .select("*,supplier:logistics_suppliers(company_name,supplier_code)")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return (data as PurchaseOrder | null) ?? null;
}

export async function countPendingPurchaseOrders(): Promise<number> {
  const supabase = getSupabaseServerClient();
  return safeCount(
    supabase
      .from("simple_purchase_orders" as never)
      .select("*", { count: "exact", head: true })
      .eq("status", "submitted"),
  );
}

export async function createPurchaseOrder(
  input: CreatePurchaseOrderInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  const supplierId = String(input.supplier_id ?? "").trim();
  if (!supplierId) return { success: false, error: "Fournisseur requis." };
  const items = (input.items ?? []).filter(
    (it) => it.item_name?.trim() && Number(it.quantity) > 0,
  );
  if (items.length === 0) {
    return { success: false, error: "Ajoutez au moins une ligne d'article." };
  }
  const total = items.reduce(
    (acc, it) => acc + Number(it.quantity) * Number(it.unit_price_gnf ?? 0),
    0,
  );

  const { data, error } = await supabase
    .from("simple_purchase_orders" as never)
    .insert({
      supplier_id: supplierId,
      status: "submitted",
      items: items.map((it) => ({
        item_name: it.item_name.trim(),
        quantity: Number(it.quantity),
        unit_price_gnf: Number(it.unit_price_gnf ?? 0),
      })),
      total_amount_gnf: total,
      expected_date: input.expected_date || null,
      notes: input.notes?.trim() || null,
      created_by: input.created_by ?? null,
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Échec de création." };
  }
  return { success: true, id: String((data as { id: string }).id) };
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: PurchaseOrderStatus,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status };
  if (status === "approved") patch.approved_at = now;
  if (status === "received") patch.received_at = now;
  if (status === "cancelled") patch.cancelled_at = now;

  const { error } = await supabase
    .from("simple_purchase_orders" as never)
    .update(patch as never)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function setPurchaseOrderApprovalRequest(
  id: string,
  approvalRequestId: string,
): Promise<void> {
  const supabase = getSupabaseServerClient();
  await supabase
    .from("simple_purchase_orders" as never)
    .update({ approval_request_id: approvalRequestId } as never)
    .eq("id", id);
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD KPIs
// ═══════════════════════════════════════════════════════════════════════════

export type LogistiqueDashboardKpis = {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalInventoryValueGnf: number;
  pendingOrders: number;
  activeSuppliers: number;
  movementsThisWeek: number;
  chart7Days: ChartPoint[];
  recentActivity: ActivityItem[];
  alerts: AlertItem[];
};

export async function getLogistiqueDashboardKpis(): Promise<LogistiqueDashboardKpis> {
  const supabase = getSupabaseServerClient();
  const sevenDaysAgo = sevenDaysAgoIso();
  void startOfMonthIso;

  const [
    totalItems,
    pendingOrders,
    activeSuppliers,
    movementsThisWeek,
    movementRows,
    itemRows,
    lowStockSample,
    activity,
  ] = await Promise.all([
    safeCount(
      supabase.from("stock_items" as never).select("*", { count: "exact", head: true }).is("deleted_at", null),
    ),
    safeCount(
      supabase
        .from("simple_purchase_orders" as never)
        .select("*", { count: "exact", head: true })
        .in("status", ["submitted", "approved"]),
    ),
    safeCount(
      supabase
        .from("logistics_suppliers" as never)
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
    ),
    safeCount(
      supabase
        .from("stock_movements_logistique" as never)
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo),
    ),
    safeRows<{ created_at: string; type: string; quantity: number }>(
      supabase
        .from("stock_movements_logistique" as never)
        .select("created_at,type,quantity")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: true }),
    ),
    safeRows<{ quantity: number; min_quantity: number; unit_price_gnf: number }>(
      supabase
        .from("stock_items" as never)
        .select("quantity,min_quantity,unit_price_gnf")
        .is("deleted_at", null),
    ),
    safeRows<{ id: string; name: string; quantity: number; min_quantity: number }>(
      supabase
        .from("stock_items" as never)
        .select("id,name,quantity,min_quantity")
        .is("deleted_at", null)
        .order("quantity", { ascending: true })
        .limit(50),
    ),
    getRecentActivity(supabase, {
      moduleKeys: getDeptActivityModuleKeys("logistique"),
      limit: 8,
    }),
  ]);

  let lowStockItems = 0;
  let outOfStockItems = 0;
  let totalInventoryValueGnf = 0;
  for (const r of itemRows) {
    const qty = Number(r.quantity ?? 0);
    const min = Number(r.min_quantity ?? 0);
    const price = Number(r.unit_price_gnf ?? 0);
    if (qty <= 0) outOfStockItems++;
    else if (qty <= min) lowStockItems++;
    totalInventoryValueGnf += qty * price;
  }

  // 7-day movement count chart
  const chartMap = new Map<string, number>();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    chartMap.set(d, 0);
  }
  for (const row of movementRows) {
    const d = row.created_at.slice(0, 10);
    if (chartMap.has(d)) chartMap.set(d, (chartMap.get(d) ?? 0) + 1);
  }
  const chart7Days: ChartPoint[] = Array.from(chartMap.entries()).map(([date, value]) => ({
    date,
    value,
  }));

  const alerts: AlertItem[] = lowStockSample
    .filter((s) => {
      const q = Number(s.quantity ?? 0);
      const m = Number(s.min_quantity ?? 0);
      return q <= m;
    })
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      level: Number(s.quantity ?? 0) <= 0 ? "HIGH" : "MEDIUM",
      title: Number(s.quantity ?? 0) <= 0 ? "Rupture de stock" : "Stock bas",
      description: `${s.name} — Qté ${Number(s.quantity ?? 0)} / Seuil ${Number(s.min_quantity ?? 0)}`,
      time: new Date().toISOString(),
    }));

  return {
    totalItems,
    lowStockItems,
    outOfStockItems,
    totalInventoryValueGnf,
    pendingOrders,
    activeSuppliers,
    movementsThisWeek,
    chart7Days,
    recentActivity: activity,
    alerts,
  };
}
