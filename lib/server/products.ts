import type { Product } from "@/types/product";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { Json } from "@/types/database.types";
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/lib/validations/product";

type ProductListParams = {
  search?: string;
  page?: number;
  pageSize?: 10 | 25 | 50;
};

type ProductListResult = {
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type RequestContext = {
  ip?: string | null;
  userAgent?: string | null;
};

const PRODUCT_COLUMNS =
  "id,sku,name,description,image_url,unit,price_gnf,stock_quantity,stock_threshold,created_by,created_at,updated_at,deleted_at";

function getProductsTable() {
  const supabase = getSupabaseServerClient();
  return supabase.from("products");
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
    module_key: "produits",
    action_key: params.actionKey,
    target_table: "products",
    target_id: params.targetId ?? null,
    metadata: params.metadata ?? {},
  });

  if (error) {
    throw new Error(`Impossible d'écrire le journal d'activité: ${error.message}`);
  }
}

function sanitizeProductForLog(product: Product | null) {
  if (!product) return null;
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    unit: product.unit,
    price_gnf: product.price_gnf,
    stock_quantity: product.stock_quantity,
    stock_threshold: product.stock_threshold,
    deleted_at: product.deleted_at,
  };
}

function normalizePagination(page?: number, pageSize?: number) {
  const safePage = Number.isInteger(page) && (page ?? 1) > 0 ? (page as number) : 1;
  const allowedPageSizes: Array<10 | 25 | 50> = [10, 25, 50];
  const safePageSize = allowedPageSizes.includes(pageSize as 10 | 25 | 50)
    ? (pageSize as 10 | 25 | 50)
    : 10;

  return { safePage, safePageSize };
}

export async function listProducts(params: ProductListParams = {}): Promise<ProductListResult> {
  const { safePage, safePageSize } = normalizePagination(params.page, params.pageSize);
  const search = params.search?.trim() ?? "";
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = getProductsTable()
    .select(PRODUCT_COLUMNS, { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (search) {
    const escaped = search.replace(/,/g, "\\,");
    query = query.or(`sku.ilike.%${escaped}%,name.ilike.%${escaped}%`);
  }

  const { data, count, error } = await query.range(from, to);
  if (error) {
    throw new Error(`Impossible de charger la liste des produits: ${error.message}`);
  }

  const total = count ?? 0;
  const totalPages = total === 0 ? 1 : Math.ceil(total / safePageSize);

  return {
    data: (data ?? []) as Product[],
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!id || !id.trim()) {
    throw new Error("ID produit invalide");
  }

  const { data, error } = await getProductsTable()
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Impossible de récupérer le produit: ${error.message}`);
  }

  return (data ?? null) as Product | null;
}

export async function createProduct(
  input: CreateProductInput,
  userId: string,
  context?: RequestContext,
): Promise<Product> {
  if (!userId || !userId.trim()) {
    throw new Error("Utilisateur non authentifié");
  }

  const validated = createProductSchema.parse(input);
  const payload = { ...validated, created_by: userId };

  const { data, error } = await getProductsTable()
    .insert(payload)
    .select(PRODUCT_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Impossible de créer le produit: ${error.message}`);
  }

  try {
    await createActivityLog({
      actorUserId: userId,
      actionKey: "create",
      targetId: data.id,
      metadata: {
        before: null,
        after: sanitizeProductForLog(data as Product),
        context: { ip: context?.ip ?? null, userAgent: context?.userAgent ?? null },
      },
    });
  } catch (logError) {
    console.error("[ActivityLog] Failed to log product create:", logError);
  }

  return data as Product;
}

export async function updateProduct(
  id: string,
  input: Omit<UpdateProductInput, "id">,
  userId: string,
  context?: RequestContext,
): Promise<Product> {
  if (!id || !id.trim()) {
    throw new Error("ID produit invalide");
  }

  const previousProduct = await getProductById(id);
  if (!previousProduct) {
    throw new Error("Produit introuvable");
  }

  const validated = updateProductSchema.parse({ id, ...input });
  const payload = {
    sku: validated.sku,
    name: validated.name,
    description: validated.description ?? null,
    image_url: validated.image_url ?? null,
    unit: validated.unit,
    price_gnf: validated.price_gnf,
    stock_quantity: validated.stock_quantity,
    stock_threshold: validated.stock_threshold,
  };

  const { data, error } = await getProductsTable()
    .update(payload)
    .eq("id", id)
    .is("deleted_at", null)
    .select(PRODUCT_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Impossible de mettre à jour le produit: ${error.message}`);
  }

  try {
    await createActivityLog({
      actorUserId: userId,
      actionKey: "update",
      targetId: data.id,
      metadata: {
        before: sanitizeProductForLog(previousProduct),
        after: sanitizeProductForLog(data as Product),
        context: { ip: context?.ip ?? null, userAgent: context?.userAgent ?? null },
      },
    });
  } catch (logError) {
    console.error("[ActivityLog] Failed to log product update:", logError);
  }

  return data as Product;
}

export async function softDeleteProduct(
  id: string,
  userId: string,
  context?: RequestContext,
): Promise<{ success: true }> {
  if (!id || !id.trim()) {
    throw new Error("ID produit invalide");
  }

  const previousProduct = await getProductById(id);
  if (!previousProduct) {
    throw new Error("Produit introuvable");
  }

  const { error } = await getProductsTable()
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`Impossible de supprimer le produit: ${error.message}`);
  }

  try {
    await createActivityLog({
      actorUserId: userId,
      actionKey: "delete",
      targetId: id,
      metadata: {
        before: sanitizeProductForLog(previousProduct),
        after: null,
        context: { ip: context?.ip ?? null, userAgent: context?.userAgent ?? null },
      },
    });
  } catch (logError) {
    console.error("[ActivityLog] Failed to log product delete:", logError);
  }

  return { success: true };
}
