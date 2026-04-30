"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions } from "@/lib/server/permissions";
import { softDeleteProduct, restoreProduct } from "@/lib/server/products";
import { ok, err, type SafeResult } from "@/lib/server/safe-result";
import { mapProductError } from "@/lib/server/product-error-messages";

const MODULE_KEYS = ["produits", "vente"] as const;

/**
 * Suppression logique d'un produit depuis la liste (/vente/produits).
 */
export async function deleteProductFromListAction(productId: string): Promise<SafeResult<null>> {
  const id = (productId ?? "").trim();
  if (!id) {
    return err("Produit invalide.");
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    return err("Non authentifié.");
  }

  const perms = await getModulePermissions(data.user.id, [...MODULE_KEYS]);
  if (!perms.canDelete) {
    return err("Accès refusé: vous n'avez pas la permission pour cette action.");
  }

  try {
    await softDeleteProduct(id);
  } catch (e) {
    return err(mapProductError(e, "Impossible de supprimer le produit pour le moment."));
  }

  revalidatePath("/vente/produits");
  revalidatePath(`/vente/produits/${id}`);
  return ok(null);
}

/**
 * Suppression logique multiple depuis la liste produits.
 */
export async function deleteProductsFromListBulkAction(productIds: string[]): Promise<SafeResult<{ deleted: number }>> {
  const ids = Array.from(new Set((productIds ?? []).map((id) => id.trim()).filter(Boolean)));
  if (ids.length === 0) {
    return err("Aucun produit sélectionné.");
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    return err("Non authentifié.");
  }

  const perms = await getModulePermissions(data.user.id, [...MODULE_KEYS]);
  if (!perms.canDelete) {
    return err("Accès refusé: vous n'avez pas la permission pour cette action.");
  }

  let deleted = 0;
  for (const id of ids) {
    try {
      await softDeleteProduct(id);
      deleted += 1;
    } catch {
      // On continue pour supprimer le maximum d'éléments possible.
    }
  }

  if (deleted === 0) {
    return err("Aucun produit n'a pu être supprimé.");
  }

  revalidatePath("/vente/produits");
  return ok({ deleted });
}

/**
 * Restauration depuis les archives (/vente/produits/archives).
 */
export async function restoreProductAction(productId: string): Promise<SafeResult<null>> {
  const id = (productId ?? "").trim();
  if (!id) {
    return err("Produit invalide.");
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    return err("Non authentifié.");
  }

  const perms = await getModulePermissions(data.user.id, [...MODULE_KEYS]);
  if (!perms.canDelete) {
    return err("Accès refusé: vous n'avez pas la permission pour cette action.");
  }

  try {
    await restoreProduct(id);
  } catch (e) {
    return err(mapProductError(e, "Impossible de restaurer le produit pour le moment."));
  }

  revalidatePath("/vente/produits/archives");
  revalidatePath("/admin/archives");
  revalidatePath("/vente/produits");
  revalidatePath(`/vente/produits/${id}`);
  return ok(null);
}
