import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { logError } from "@/lib/logger";
import { safeCount, safeRows } from "@/lib/utils/safe-query";
import { SALES_OPERATIONAL_LIFECYCLE } from "@/lib/vente/runtime/sales-lifecycle";

export type TopProduct = {
  product_id: string;
  product_name: string;
  category: string | null;
  total_quantity: number;
  total_revenue_gnf: number;
  sale_count: number;
};

export type TopClient = {
  client_id: string;
  client_name: string;
  company: string | null;
  total_purchases_gnf: number;
  purchase_count: number;
  average_basket_gnf: number;
};

export type MonthlyRevenue = {
  month: string;
  month_label: string;
  revenue_gnf: number;
  sale_count: number;
};

export type CategoryRevenue = {
  category: string;
  revenue_gnf: number;
  percentage: number;
};

export type SalesAnalytics = {
  topProducts: TopProduct[];
  topClients: TopClient[];
  monthlyRevenue: MonthlyRevenue[];
  categoryRevenue: CategoryRevenue[];
  totalRevenue: number;
  totalSales: number;
  averageBasket: number;
  newClientsThisMonth: number;
  returningClientsRate: number;
  leadConversionRate: number | null;
  highestSaleGnf: number;
  topCategory: string | null;
};

const MONTH_FR = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
] as const;

const SALE_COLUMNS = "id, total_amount_gnf, created_at, client_id";
const IN_CHUNK_SIZE = 150;

type ClientJoin = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  client_type: string;
};

type SaleAnalyticsRow = {
  id: string;
  total_amount_gnf: number;
  created_at: string;
  client_id: string | null;
  clients: ClientJoin | null;
};

type SaleItemAnalyticsRow = {
  sale_id: string;
  quantity: number;
  total_price_gnf: number;
  product_id: string | null;
  product_name: string;
};

export const EMPTY_SALES_ANALYTICS: SalesAnalytics = {
  topProducts: [],
  topClients: [],
  monthlyRevenue: [],
  categoryRevenue: [],
  totalRevenue: 0,
  totalSales: 0,
  averageBasket: 0,
  newClientsThisMonth: 0,
  returningClientsRate: 0,
  leadConversionRate: null,
  highestSaleGnf: 0,
  topCategory: null,
};

function clientDisplayName(c: ClientJoin | null): string {
  if (!c) return "Client anonyme";
  if (c.client_type === "company" && c.company_name?.trim()) {
    return c.company_name.trim();
  }
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  return name || "—";
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthSeries(months: number): string[] {
  const keys: string[] = [];
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setMonth(cursor.getMonth() - i);
    keys.push(monthKey(d));
  }
  return keys;
}

function monthLabelFromKey(key: string): string {
  const [y, m] = key.split("-");
  const idx = Number(m) - 1;
  const label = MONTH_FR[idx] ?? m;
  return `${label} ${y}`;
}

function isSchemaCompatError(error: unknown): boolean {
  const msg = String((error as { message?: string })?.message ?? error ?? "").toLowerCase();
  return (
    msg.includes("lifecycle_status") ||
    msg.includes("does not exist") ||
    msg.includes("column") ||
    msg.includes("crm_leads") ||
    msg.includes("schema cache")
  );
}

async function fetchSalesInPeriod(
  startDateStr: string,
): Promise<Omit<SaleAnalyticsRow, "clients">[]> {
  const supabase = getSupabaseServerClient();

  const lifecycleQuery = await supabase
    .from("sales")
    .select(SALE_COLUMNS)
    .eq("lifecycle_status", SALES_OPERATIONAL_LIFECYCLE)
    .gte("created_at", startDateStr)
    .order("created_at", { ascending: false });

  if (!lifecycleQuery.error) {
    return (lifecycleQuery.data ?? []) as Omit<SaleAnalyticsRow, "clients">[];
  }

  if (!isSchemaCompatError(lifecycleQuery.error)) {
    logError("sales-analytics", "sales query failed", { error: lifecycleQuery.error.message });
    return [];
  }

  const legacyQuery = await supabase
    .from("sales")
    .select(SALE_COLUMNS)
    .is("deleted_at", null)
    .neq("payment_status", "cancelled")
    .gte("created_at", startDateStr)
    .order("created_at", { ascending: false });

  if (legacyQuery.error) {
    logError("sales-analytics", "sales legacy query failed", { error: legacyQuery.error.message });
    return [];
  }

  return (legacyQuery.data ?? []) as Omit<SaleAnalyticsRow, "clients">[];
}

async function fetchSaleItemsForSales(saleIds: string[]): Promise<SaleItemAnalyticsRow[]> {
  if (saleIds.length === 0) return [];

  const supabase = getSupabaseServerClient();
  const rows: SaleItemAnalyticsRow[] = [];

  for (let i = 0; i < saleIds.length; i += IN_CHUNK_SIZE) {
    const chunk = saleIds.slice(i, i + IN_CHUNK_SIZE);
    const batch = await safeRows<SaleItemAnalyticsRow>(
      supabase
        .from("sale_items")
        .select("sale_id, quantity, total_price_gnf, product_id, product_name")
        .in("sale_id", chunk),
    );
    rows.push(...batch);
  }

  return rows;
}

async function fetchProductUnits(productIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (productIds.length === 0) return map;

  const supabase = getSupabaseServerClient();
  for (let i = 0; i < productIds.length; i += IN_CHUNK_SIZE) {
    const chunk = productIds.slice(i, i + IN_CHUNK_SIZE);
    const rows = await safeRows<{ id: string; unit: string }>(
      supabase.from("products").select("id, unit").in("id", chunk),
    );
    for (const p of rows) {
      map.set(p.id, p.unit);
    }
  }
  return map;
}

async function fetchClientsByIds(clientIds: string[]): Promise<Map<string, ClientJoin>> {
  const map = new Map<string, ClientJoin>();
  if (clientIds.length === 0) return map;

  const supabase = getSupabaseServerClient();
  for (let i = 0; i < clientIds.length; i += IN_CHUNK_SIZE) {
    const chunk = clientIds.slice(i, i + IN_CHUNK_SIZE);
    const rows = await safeRows<ClientJoin>(
      supabase
        .from("clients")
        .select("id, first_name, last_name, company_name, client_type")
        .in("id", chunk),
    );
    for (const c of rows) {
      map.set(c.id, c);
    }
  }
  return map;
}

async function loadSalesAnalytics(params?: {
  months?: number;
  limit?: number;
}): Promise<SalesAnalytics> {
  const months = params?.months ?? 12;
  const limit = params?.limit ?? 5;
  const supabase = getSupabaseServerClient();

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  const startDateStr = startDate.toISOString();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartStr = monthStart.toISOString();

  const monthKeys = buildMonthSeries(months);

  const [salesRaw, newClientsThisMonth, totalLeads, convertedLeads] = await Promise.all([
    fetchSalesInPeriod(startDateStr),
    safeCount(
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .gte("created_at", monthStartStr),
    ),
    safeCount(
      supabase
        .from("crm_leads")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
    ),
    safeCount(
      supabase
        .from("crm_leads")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .or("status.eq.converted,converted_client_id.not.is.null"),
    ),
  ]);

  const saleIds = salesRaw.map((s) => s.id);
  const clientIds = Array.from(
    new Set(salesRaw.map((s) => s.client_id).filter((id): id is string => Boolean(id))),
  );

  const [saleItems, clientById] = await Promise.all([
    fetchSaleItemsForSales(saleIds),
    fetchClientsByIds(clientIds),
  ]);

  const productIds = Array.from(
    new Set(saleItems.map((i) => i.product_id).filter((id): id is string => Boolean(id))),
  );
  const productUnitById = await fetchProductUnits(productIds);

  const sales: SaleAnalyticsRow[] = salesRaw.map((s) => ({
    ...s,
    clients: s.client_id ? clientById.get(s.client_id) ?? null : null,
  }));

  const totalRevenue = sales.reduce((s, r) => s + Number(r.total_amount_gnf ?? 0), 0);
  const totalSales = sales.length;
  const averageBasket = totalSales > 0 ? totalRevenue / totalSales : 0;
  const highestSaleGnf = sales.reduce(
    (max, r) => Math.max(max, Number(r.total_amount_gnf ?? 0)),
    0,
  );

  const productMap = new Map<
    string,
    { name: string; category: string | null; qty: number; revenue: number; saleIds: Set<string> }
  >();
  for (const item of saleItems) {
    const pid = item.product_id ?? `name:${item.product_name}`;
    const unit = item.product_id ? productUnitById.get(item.product_id) : null;
    const category = unit?.trim() || "Autres";
    const revenue = Number(item.total_price_gnf ?? 0);
    const qty = Number(item.quantity ?? 0);
    const existing = productMap.get(pid) ?? {
      name: item.product_name,
      category,
      qty: 0,
      revenue: 0,
      saleIds: new Set<string>(),
    };
    existing.qty += qty;
    existing.revenue += revenue;
    existing.saleIds.add(item.sale_id);
    productMap.set(pid, existing);
  }

  const topProducts: TopProduct[] = Array.from(productMap.entries())
    .map(([product_id, v]) => ({
      product_id,
      product_name: v.name,
      category: v.category,
      total_quantity: v.qty,
      total_revenue_gnf: v.revenue,
      sale_count: v.saleIds.size,
    }))
    .sort((a, b) => b.total_revenue_gnf - a.total_revenue_gnf)
    .slice(0, limit);

  const clientMap = new Map<
    string,
    { name: string; company: string | null; total: number; count: number }
  >();
  for (const sale of sales) {
    const cid = sale.client_id ?? "__anonymous__";
    const client = sale.clients;
    const existing = clientMap.get(cid) ?? {
      name: clientDisplayName(client),
      company: client?.company_name ?? null,
      total: 0,
      count: 0,
    };
    existing.total += Number(sale.total_amount_gnf ?? 0);
    existing.count += 1;
    clientMap.set(cid, existing);
  }

  const topClients: TopClient[] = Array.from(clientMap.entries())
    .filter(([id]) => id !== "__anonymous__")
    .map(([client_id, v]) => ({
      client_id,
      client_name: v.name,
      company: v.company,
      total_purchases_gnf: v.total,
      purchase_count: v.count,
      average_basket_gnf: v.count > 0 ? v.total / v.count : 0,
    }))
    .sort((a, b) => b.total_purchases_gnf - a.total_purchases_gnf)
    .slice(0, limit);

  const monthAgg = new Map<string, { revenue: number; count: number }>();
  for (const key of monthKeys) {
    monthAgg.set(key, { revenue: 0, count: 0 });
  }
  for (const sale of sales) {
    const key = monthKey(new Date(sale.created_at));
    if (!monthAgg.has(key)) continue;
    const row = monthAgg.get(key)!;
    row.revenue += Number(sale.total_amount_gnf ?? 0);
    row.count += 1;
  }

  const monthlyRevenue: MonthlyRevenue[] = monthKeys.map((key) => {
    const row = monthAgg.get(key)!;
    return {
      month: key,
      month_label: monthLabelFromKey(key),
      revenue_gnf: row.revenue,
      sale_count: row.count,
    };
  });

  const catMap = new Map<string, number>();
  for (const item of saleItems) {
    const unit = item.product_id ? productUnitById.get(item.product_id) : null;
    const cat = unit?.trim() || "Autres";
    catMap.set(cat, (catMap.get(cat) ?? 0) + Number(item.total_price_gnf ?? 0));
  }
  const catTotal = Array.from(catMap.values()).reduce((s, v) => s + v, 0);
  const categoryRevenue: CategoryRevenue[] = Array.from(catMap.entries())
    .map(([category, revenue_gnf]) => ({
      category,
      revenue_gnf,
      percentage: catTotal > 0 ? Math.round((revenue_gnf / catTotal) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.revenue_gnf - a.revenue_gnf);

  const topCategory = categoryRevenue[0]?.category ?? null;

  const clientsWithSales = Array.from(clientMap.entries()).filter(
    ([id]) => id !== "__anonymous__",
  );
  const returningCount = clientsWithSales.filter(([, v]) => v.count > 1).length;
  const returningClientsRate =
    clientsWithSales.length > 0
      ? Math.round((returningCount / clientsWithSales.length) * 1000) / 10
      : 0;

  const leadConversionRate =
    totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 1000) / 10 : null;

  return {
    topProducts,
    topClients,
    monthlyRevenue,
    categoryRevenue,
    totalRevenue,
    totalSales,
    averageBasket,
    newClientsThisMonth,
    returningClientsRate,
    leadConversionRate,
    highestSaleGnf,
    topCategory,
  };
}

/** Ne lève jamais — évite l'écran « Erreur module vente ». */
export async function getSalesAnalytics(params?: {
  months?: number;
  limit?: number;
}): Promise<SalesAnalytics> {
  try {
    return await loadSalesAnalytics(params);
  } catch (error) {
    logError("sales-analytics", "getSalesAnalytics failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    const months = params?.months ?? 12;
    const monthKeys = buildMonthSeries(months);
    return {
      ...EMPTY_SALES_ANALYTICS,
      monthlyRevenue: monthKeys.map((key) => ({
        month: key,
        month_label: monthLabelFromKey(key),
        revenue_gnf: 0,
        sale_count: 0,
      })),
    };
  }
}

export async function getVenteAnalyticsSnapshot(): Promise<{
  averageBasket: number;
  topProductName: string | null;
}> {
  const data = await getSalesAnalytics({ months: 1, limit: 1 });
  return {
    averageBasket: data.averageBasket,
    topProductName: data.topProducts[0]?.product_name ?? null,
  };
}
