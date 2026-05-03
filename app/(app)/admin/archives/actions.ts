"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole } from "@/lib/server/permissions";
import { restoreClient } from "@/lib/server/clients";
import { restoreProduct } from "@/lib/server/products";
import { ok, err, type SafeResult } from "@/lib/server/safe-result";

async function requireAdminSession(): Promise<{ userId: string } | null> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) return null;
  if (!(await isAdminRole(data.user.id))) return null;
  return { userId: data.user.id };
}

function auditContext() {
  const h = headers();
  return {
    ip: h.get("x-forwarded-for") ?? h.get("x-real-ip"),
    userAgent: h.get("user-agent"),
  };
}

function normalizeIds(raw: string[]): string[] {
  return Array.from(new Set((raw ?? []).map((id) => id.trim()).filter(Boolean)));
}

function revalidateArchives() {
  revalidatePath("/admin/archives");
  revalidatePath("/vente/clients/archives");
  revalidatePath("/vente/produits/archives");
  revalidatePath("/vente/clients");
  revalidatePath("/vente/produits");
}

export async function adminBulkRestoreArchivedClientsAction(
  clientIds: string[],
): Promise<SafeResult<{ restored: number }>> {
  const session = await requireAdminSession();
  if (!session) return err("Accès refusé.");

  const ids = normalizeIds(clientIds);
  if (ids.length === 0) return err("Aucun client sélectionné.");

  let restored = 0;
  const ctx = auditContext();
  for (const id of ids) {
    try {
      await restoreClient(id, session.userId, ctx);
      restored += 1;
    } catch {
      /* ignorer */
    }
  }

  if (restored === 0) return err("Aucun client n'a pu être restauré.");

  revalidateArchives();
  return ok({ restored });
}

export async function adminBulkRestoreArchivedProductsAction(
  productIds: string[],
): Promise<SafeResult<{ restored: number }>> {
  const session = await requireAdminSession();
  if (!session) return err("Accès refusé.");

  const ids = normalizeIds(productIds);
  if (ids.length === 0) return err("Aucun produit sélectionné.");

  let restored = 0;
  for (const id of ids) {
    try {
      await restoreProduct(id);
      restored += 1;
    } catch {
      /* ignorer */
    }
  }

  if (restored === 0) return err("Aucun produit n'a pu être restauré.");

  revalidateArchives();
  return ok({ restored });
}

export async function adminPermanentDeleteArchivedClientsAction(
  clientIds: string[],
): Promise<SafeResult<{ deleted: number }>> {
  const session = await requireAdminSession();
  if (!session) return err("Accès refusé.");

  const ids = normalizeIds(clientIds);
  if (ids.length === 0) return err("Aucun client sélectionné.");

  const supabase = getSupabaseServerClient();
  let deleted = 0;
  let lastError = "Suppression impossible.";

  for (const id of ids) {
    const { error } = await supabase.rpc("admin_permanently_delete_archived_client", {
      p_client_id: id,
    });
    if (error) {
      lastError = error.message || lastError;
      continue;
    }
    deleted += 1;
  }

  if (deleted === 0) return err(lastError);

  revalidateArchives();
  return ok({ deleted });
}

export async function adminPermanentDeleteArchivedProductsAction(
  productIds: string[],
): Promise<SafeResult<{ deleted: number }>> {
  const session = await requireAdminSession();
  if (!session) return err("Accès refusé.");

  const ids = normalizeIds(productIds);
  if (ids.length === 0) return err("Aucun produit sélectionné.");

  const supabase = getSupabaseServerClient();
  let deleted = 0;
  let lastError = "Suppression impossible.";

  for (const id of ids) {
    const { error } = await supabase.rpc("admin_permanently_delete_archived_product", {
      p_product_id: id,
    });
    if (error) {
      lastError = error.message || lastError;
      continue;
    }
    deleted += 1;
  }

  if (deleted === 0) return err(lastError);

  revalidateArchives();
  return ok({ deleted });
}
