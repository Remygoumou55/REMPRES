import type { Product } from "@/types/product";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { Json } from "@/types/database.types";
import { createProductSchema, type CreateProductInput } from "@/lib/validations/product";
import { getModulePermissions, type ModulePermissions } from "@/lib/server/permissions";

const PRODUCT_COLUMNS =
  "id,sku,name,description,image_url,unit,price_gnf,stock_quantity,stock_threshold,created_by,created_at,updated_at,deleted_at,deleted_by";

const MODULE_KEYS = ["produits", "vente"] as const;

/**
 * Identité = session Supabase uniquement. Jamais de userId passé par le client.
 */
async function requireSessionUserId(): Promise<string> {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Non authentifié");
  }
  return user.id;
}

async function requireProductPermissions(
  require: Partial<Pick<ModulePermissions, "canRead" | "canCreate" | "canUpdate" | "canDelete">>,
): Promise<{ userId: string; perms: ModulePermissions }> {
  const userId = await requireSessionUserId();
  const perms = await getModulePermissions(userId, [...MODULE_KEYS]);
  if (require.canRead && !perms.canRead) {
    throw new Error("Accès refusé : lecture produits");
  }
  if (require.canCreate && !perms.canCreate) {
    throw new Error("Accès refusé : création produit");
  }
  if (require.canUpdate && !perms.canUpdate) {
    throw new Error("Accès refusé : modification produit");
  }
  if (require.canDelete && !perms.canDelete) {
    throw new Error("Accès refusé : suppression produit");
  }
  return { userId, perms };
}

function getProductsTable() {
  return getSupabaseServerClient().from("products");
}

async function createActivityLog(params: {
  actorUserId: string;
  actionKey: "create" | "update" | "delete" | "RESTORE";
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

function sanitizeProductForLog(p: Product | null) {
  if (!p) return null;
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    unit: p.unit,
    price_gnf: p.price_gnf,
    stock_quantity: p.stock_quantity,
    stock_threshold: p.stock_threshold,
    deleted_at: p.deleted_at,
    deleted_by: p.deleted_by,
  };
}

/**
 * Détail d’un produit. Session + droit lecture ; RLS renforce côté base.
 */
export async function getProductById(id: string): Promise<Product | null> {
  if (!id?.trim()) throw new Error("ID produit invalide");
  await requireProductPermissions({ canRead: true });

  const { data, error } = await getProductsTable()
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Impossible de récupérer le produit: ${error.message}`);
  }
  if (!data) {
    return null;
  }
  return data as Product;
}

/**
 * Liste catalogue. Même règle : lecture.
 */
export async function listProducts(): Promise<Product[]> {
  await requireProductPermissions({ canRead: true });

  const { data, error } = await getProductsTable()
    .select(PRODUCT_COLUMNS)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Impossible de charger les produits: ${error.message}`);
  }
  return (data ?? []) as Product[];
}

/**
 * Produits archivés (soft delete). Nécessite canDelete (aligné RLS).
 */
export async function listArchivedProducts(): Promise<Product[]> {
  await requireProductPermissions({ canDelete: true });

  const { data, error } = await getProductsTable()
    .select(PRODUCT_COLUMNS)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    throw new Error(`Impossible de charger les produits archivés: ${error.message}`);
  }
  return (data ?? []) as Product[];
}

/**
 * Création. `created_by` = session (re-vérifié, jamais fourni par le body).
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  const { userId } = await requireProductPermissions({ canCreate: true });
  const validated = createProductSchema.parse(input);

  const { data, error } = await getProductsTable()
    .insert({
      ...validated,
      created_by: userId,
    })
    .select(PRODUCT_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Impossible de créer le produit: ${error.message}`);
  }

  const row = data as Product;
  try {
    await createActivityLog({
      actorUserId: userId,
      actionKey: "create",
      targetId: row.id,
      metadata: {
        before: null,
        after: sanitizeProductForLog(row),
      },
    });
  } catch (logErr) {
    console.error("[ActivityLog] produit create:", logErr);
  }

  return row;
}

/**
 * Mise à jour. Permission applicative canUpdate ; RLS = créateur ou super_admin.
 */
export async function updateProduct(id: string, input: CreateProductInput): Promise<Product> {
  const { userId } = await requireProductPermissions({ canUpdate: true });
  const validated = createProductSchema.parse(input);

  const { data: before } = await getProductsTable()
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!before) {
    throw new Error("Produit introuvable");
  }

  const { data, error } = await getProductsTable()
    .update({
      ...validated,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select(PRODUCT_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Impossible de mettre à jour le produit: ${error.message}`);
  }

  const row = data as Product;
  try {
    await createActivityLog({
      actorUserId: userId,
      actionKey: "update",
      targetId: id,
      metadata: {
        before: sanitizeProductForLog(before as Product | null),
        after: sanitizeProductForLog(row),
      },
    });
  } catch (logErr) {
    console.error("[ActivityLog] produit update:", logErr);
  }

  return row;
}

/**
 * Soft delete. Permission canDelete.
 */
export async function softDeleteProduct(id: string): Promise<void> {
  const { userId } = await requireProductPermissions({ canDelete: true });

  const { data: before } = await getProductsTable()
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!before) {
    throw new Error("Produit introuvable");
  }

  const { data: updatedRows, error } = await getProductsTable()
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    throw new Error(`Impossible de supprimer le produit: ${error.message}`);
  }
  if (!updatedRows?.length) {
    throw new Error(
      "Impossible de supprimer le produit: accès refusé, produit introuvable ou déjà supprimé.",
    );
  }

  try {
    await createActivityLog({
      actorUserId: userId,
      actionKey: "delete",
      targetId: id,
      metadata: {
        before: sanitizeProductForLog(before as Product | null),
        after: null,
      },
    });
  } catch (logErr) {
    console.error("[ActivityLog] produit delete:", logErr);
  }
}

/**
 * Restaure un produit archivé.
 */
export async function restoreProduct(id: string): Promise<Product> {
  if (!id?.trim()) throw new Error("ID produit invalide");
  const { userId } = await requireProductPermissions({ canDelete: true });

  const { data: archived, error: fetchErr } = await getProductsTable()
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .not("deleted_at", "is", null)
    .maybeSingle();

  if (fetchErr) {
    throw new Error(`Impossible de lire le produit archivé: ${fetchErr.message}`);
  }
  if (!archived) {
    throw new Error("Produit archivé introuvable");
  }

  const { data: rows, error } = await getProductsTable()
    .update({
      deleted_at: null,
      deleted_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .not("deleted_at", "is", null)
    .select(PRODUCT_COLUMNS);

  if (error) {
    throw new Error(`Impossible de restaurer le produit: ${error.message}`);
  }
  if (!rows?.length) {
    throw new Error("Impossible de restaurer le produit: accès refusé ou déjà actif.");
  }

  const restored = rows[0] as Product;

  try {
    await createActivityLog({
      actorUserId: userId,
      actionKey: "RESTORE",
      targetId: id,
      metadata: {
        before: sanitizeProductForLog(archived as Product | null),
        after: sanitizeProductForLog(restored),
      },
    });
  } catch (logErr) {
    console.error("[ActivityLog] produit restore:", logErr);
  }

  return restored;
}
