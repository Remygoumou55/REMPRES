"use server";

import { redirect } from "next/navigation";
import { revalidateLogistique } from "@/lib/cache/revalidation-map";
import { createApprovalRequest } from "@/lib/server/approvals";
import { SENSITIVE_ACTIONS } from "@/lib/constants/sensitive-actions";
import { getCachedProfileRow } from "@/lib/server/profile-row";
import { getUserRole } from "@/lib/server/permissions";
import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  assertLogistiqueWrite,
  canLogistiqueDelete,
} from "@/lib/server/logistique-access";
import {
  createStockItem,
  getStockItemById,
  softDeleteStockItem,
  updateStockItem,
} from "@/lib/server/logistique";

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

export async function createStockItemAction(formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueWrite(user.id);

  const result = await createStockItem({
    name: field(formData, "name"),
    sku: field(formData, "sku") || undefined,
    category: field(formData, "category") || undefined,
    unit: field(formData, "unit"),
    quantity: Number(field(formData, "quantity")) || 0,
    min_quantity: Number(field(formData, "min_quantity")) || 0,
    unit_price_gnf: Number(field(formData, "unit_price_gnf")) || 0,
    warehouse_id: field(formData, "warehouse_id") || undefined,
    description: field(formData, "description") || undefined,
    created_by: user.id,
  });

  if (!result.success || !result.id) {
    redirect(
      `/logistique/articles/new?error=${encodeURIComponent(result.error ?? "Erreur")}`,
    );
  }
  await revalidateLogistique();
  redirect(`/logistique/articles?success=${encodeURIComponent("Article créé.")}`);
}

export async function updateStockItemAction(id: string, formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueWrite(user.id);

  const result = await updateStockItem(id, {
    name: field(formData, "name"),
    sku: field(formData, "sku") || undefined,
    category: field(formData, "category") || undefined,
    unit: field(formData, "unit"),
    quantity: Number(field(formData, "quantity")) || 0,
    min_quantity: Number(field(formData, "min_quantity")) || 0,
    unit_price_gnf: Number(field(formData, "unit_price_gnf")) || 0,
    warehouse_id: field(formData, "warehouse_id") || undefined,
    description: field(formData, "description") || undefined,
  });

  if (!result.success) {
    redirect(
      `/logistique/articles/${id}/edit?error=${encodeURIComponent(result.error ?? "Erreur")}`,
    );
  }
  await revalidateLogistique();
  redirect(
    `/logistique/articles/${id}?success=${encodeURIComponent("Article mis à jour.")}`,
  );
}

export async function deleteStockItemAction(id: string) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  if (!(await canLogistiqueDelete(user.id))) redirect("/access-denied");

  const item = await getStockItemById(id);
  const label = item ? `${item.sku ? `${item.sku} — ` : ""}${item.name}` : id;
  const [profile, roleKey] = await Promise.all([
    getCachedProfileRow(user.id),
    getUserRole(user.id),
  ]);

  const result = await createApprovalRequest({
    requestedBy: user.id,
    requesterName: profile.displayName || "Responsable Logistique",
    requesterRole: roleKey || profile.roleKey || "",
    requesterDept: "Logistique",
    actionType: SENSITIVE_ACTIONS.DELETE_STOCK_ITEM.type,
    module: SENSITIVE_ACTIONS.DELETE_STOCK_ITEM.module,
    targetId: id,
    targetLabel: label,
    description: SENSITIVE_ACTIONS.DELETE_STOCK_ITEM.description(label),
    actionPayload: { id, table: "stock_items", operation: "soft_delete" },
    priority: SENSITIVE_ACTIONS.DELETE_STOCK_ITEM.priority,
  });

  if (!result.success) {
    redirect(
      `/logistique/articles?error=${encodeURIComponent("Erreur lors de la demande")}`,
    );
  }
  redirect(
    `/logistique/articles?success=${encodeURIComponent("Demande envoyée. En attente d'approbation du Super Admin.")}`,
  );
}

export async function softDeleteStockItemDirectAction(id: string) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  if (!(await canLogistiqueDelete(user.id))) redirect("/access-denied");
  await softDeleteStockItem(id);
  await revalidateLogistique();
  redirect(`/logistique/articles?success=${encodeURIComponent("Article supprimé.")}`);
}
