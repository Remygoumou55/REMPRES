import { cache } from "react";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { Client } from "@/types/client";
import type { Product } from "@/types/product";
import type { ExpenseListRow } from "@/lib/server/expenses";

const CLIENT_COLUMNS =
  "id,client_type,first_name,last_name,company_name,email,phone,address,city,country,created_at";

const PRODUCT_COLUMNS =
  "id,sku,name,description,unit,price_gnf,cost_price_gnf,margin_pct,stock_quantity,stock_threshold,created_at";

function firstDayOfMonthIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Lecture export gouvernance — service role, réservé aux pages `/admin/exports/*`. */
export const fetchExportHubClients = cache(async function fetchExportHubClients(): Promise<Client[]> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("clients")
    .select(CLIENT_COLUMNS)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Export clients indisponible : ${error.message}`);
  }
  return (data ?? []) as Client[];
});

export const fetchExportHubProducts = cache(async function fetchExportHubProducts(): Promise<Product[]> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("products")
    .select(PRODUCT_COLUMNS)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Export produits indisponible : ${error.message}`);
  }
  return (data ?? []) as Product[];
});

export const fetchExportHubExpenses = cache(async function fetchExportHubExpenses(
  fromInput?: string,
  toInput?: string,
): Promise<ExpenseListRow[]> {
  const from = fromInput?.trim() || firstDayOfMonthIso();
  const to = toInput?.trim() || todayIsoDate();
  const admin = getSupabaseAdminClient();

  const [{ data: categories, error: catError }, { data: rows, error }] = await Promise.all([
    admin.from("expense_categories").select("id,name,color").order("sort_order", { ascending: true }),
    admin
      .from("expenses")
      .select(
        "id, category_id, description, amount_gnf, payment_method, expense_date, created_at, created_by, receipt_url",
      )
      .is("deleted_at", null)
      .gte("expense_date", from)
      .lte("expense_date", to)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (catError) {
    throw new Error(`Export dépenses indisponible : ${catError.message}`);
  }
  if (error) {
    throw new Error(`Export dépenses indisponible : ${error.message}`);
  }

  const catMap = new Map((categories ?? []).map((c) => [c.id, c] as const));

  return (rows ?? []).map((r) => {
    const c = catMap.get(r.category_id);
    return {
      ...r,
      category_name: c?.name ?? "—",
      category_color: c?.color ?? "#64748B",
    };
  });
});

export { firstDayOfMonthIso, todayIsoDate };
