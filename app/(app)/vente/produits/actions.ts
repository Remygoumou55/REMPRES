"use server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions, getUserRole } from "@/lib/server/permissions";
import { softDeleteProduct, restoreProduct } from "@/lib/server/products";
import { ok, err, type SafeResult } from "@/lib/server/safe-result";
import { mapProductError } from "@/lib/server/product-error-messages";
import { revalidateProduits } from "@/lib/cache/revalidation-map";
import { AUDIT_EVENT_TYPES } from "@/lib/audit/audit-events";
import { tryLogAuditEvent } from "@/lib/audit/audit-logger";
import { assertApprovalOrThrow } from "@/lib/approvals/approval-engine";
import { isApprovalRequiredError } from "@/lib/governance/approvals/workflow";

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
    const actorRole = await getUserRole(data.user.id);
    const approval = await assertApprovalOrThrow({
      eventType: AUDIT_EVENT_TYPES.PRODUCT_ARCHIVED,
      actorUserId: data.user.id,
      actorRole,
      departmentKey: "VENTE",
      metadata: { entity_type: "products", entity_id: id, operation: "delete_product" },
    });
    await softDeleteProduct(id);
    await tryLogAuditEvent({
      eventType: AUDIT_EVENT_TYPES.PRODUCT_ARCHIVED,
      severity: "high",
      target: { table: "products", id },
      context: { actorUserId: data.user.id, actorRole },
      details: { operation: "delete_product" },
      approval: { required: approval.required, status: "granted", policy: approval.policy },
    });
  } catch (e) {
    if (isApprovalRequiredError(e)) return err(e.message);
    return err(mapProductError(e, "Impossible de supprimer le produit pour le moment."));
  }

  await revalidateProduits({ productId: id });
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
  const actorRole = await getUserRole(data.user.id);
  let approval: Awaited<ReturnType<typeof assertApprovalOrThrow>>;
  try {
    approval = await assertApprovalOrThrow({
      eventType: AUDIT_EVENT_TYPES.BULK_OPERATION,
      actorUserId: data.user.id,
      actorRole,
      departmentKey: "VENTE",
      metadata: { entity_type: "products", entity_id: "bulk", operation: "bulk_delete_products", count: ids.length },
    });
  } catch (e) {
    if (isApprovalRequiredError(e)) return err(e.message);
    return err("Impossible de lancer la suppression groupée.");
  }
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

  await revalidateProduits();
  await tryLogAuditEvent({
    eventType: AUDIT_EVENT_TYPES.BULK_OPERATION,
    severity: "critical",
    target: { table: "products", id: null },
    context: { actorUserId: data.user.id, actorRole },
    details: { operation: "bulk_delete_products", requested: ids.length, deleted },
    approval: { required: approval.required, status: "granted", policy: approval.policy },
  });
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
    const actorRole = await getUserRole(data.user.id);
    const approval = await assertApprovalOrThrow({
      eventType: AUDIT_EVENT_TYPES.PRODUCT_ARCHIVED,
      actorUserId: data.user.id,
      actorRole,
      departmentKey: "VENTE",
      metadata: { entity_type: "products", entity_id: id, operation: "restore_product" },
    });
    await restoreProduct(id);
    await tryLogAuditEvent({
      eventType: AUDIT_EVENT_TYPES.PRODUCT_ARCHIVED,
      severity: "medium",
      target: { table: "products", id },
      context: { actorUserId: data.user.id, actorRole },
      details: { operation: "restore_product" },
      approval: { required: approval.required, status: "granted", policy: approval.policy },
    });
  } catch (e) {
    if (isApprovalRequiredError(e)) return err(e.message);
    return err(mapProductError(e, "Impossible de restaurer le produit pour le moment."));
  }

  await revalidateProduits({ productId: id });
  return ok(null);
}
