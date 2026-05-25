"use server";

import { redirect } from "next/navigation";
import { revalidateLogistique } from "@/lib/cache/revalidation-map";
import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  assertLogistiqueWrite,
  canLogistiqueApprove,
} from "@/lib/server/logistique-access";
import {
  createPurchaseOrder,
  getPurchaseOrderById,
  setPurchaseOrderApprovalRequest,
  updatePurchaseOrderStatus,
} from "@/lib/server/logistique";
import { createApprovalRequest } from "@/lib/server/approvals";
import { SENSITIVE_ACTIONS } from "@/lib/constants/sensitive-actions";
import { getCachedProfileRow } from "@/lib/server/profile-row";
import { getUserRole } from "@/lib/server/permissions";
import type { PurchaseOrderItem } from "@/lib/types/logistique";

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

export async function createPurchaseOrderAction(formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueWrite(user.id);

  const supplierId = field(formData, "supplier_id");
  const count = Number(field(formData, "lines_count")) || 0;

  const items: PurchaseOrderItem[] = [];
  for (let i = 0; i < count; i += 1) {
    const name = field(formData, `item_name_${i}`).trim();
    const qty = Number(field(formData, `quantity_${i}`)) || 0;
    const price = Number(field(formData, `unit_price_${i}`)) || 0;
    if (name && qty > 0) {
      items.push({ item_name: name, quantity: qty, unit_price_gnf: price });
    }
  }

  if (!supplierId) {
    redirect(
      `/logistique/achats/new?error=${encodeURIComponent("Sélectionnez un fournisseur.")}`,
    );
  }
  if (items.length === 0) {
    redirect(
      `/logistique/achats/new?error=${encodeURIComponent("Ajoutez au moins une ligne.")}`,
    );
  }

  const result = await createPurchaseOrder({
    supplier_id: supplierId,
    items,
    expected_date: field(formData, "expected_date") || undefined,
    notes: field(formData, "notes") || undefined,
    created_by: user.id,
  });

  if (!result.success || !result.id) {
    redirect(
      `/logistique/achats/new?error=${encodeURIComponent(result.error ?? "Erreur")}`,
    );
  }

  // Submitted PO triggers an approval request from the Super Admin
  const order = await getPurchaseOrderById(result.id);
  const [profile, roleKey] = await Promise.all([
    getCachedProfileRow(user.id),
    getUserRole(user.id),
  ]);
  const label = `${order?.reference ?? result.id} (${Math.round(
    Number(order?.total_amount_gnf ?? 0),
  ).toLocaleString("fr-FR")} GNF)`;

  const approval = await createApprovalRequest({
    requestedBy: user.id,
    requesterName: profile.displayName || "Responsable Logistique",
    requesterRole: roleKey || profile.roleKey || "",
    requesterDept: "Logistique",
    actionType: SENSITIVE_ACTIONS.APPROVE_PURCHASE_ORDER.type,
    module: SENSITIVE_ACTIONS.APPROVE_PURCHASE_ORDER.module,
    targetId: result.id,
    targetLabel: label,
    description: SENSITIVE_ACTIONS.APPROVE_PURCHASE_ORDER.description(label),
    actionPayload: {
      id: result.id,
      table: "simple_purchase_orders",
      operation: "approve",
    },
    priority: SENSITIVE_ACTIONS.APPROVE_PURCHASE_ORDER.priority,
  });

  if (approval.success && approval.requestId) {
    await setPurchaseOrderApprovalRequest(result.id, approval.requestId);
  }
  await revalidateLogistique();
  redirect(
    `/logistique/achats?success=${encodeURIComponent(
      "Commande créée. En attente d'approbation.",
    )}`,
  );
}

export async function approvePurchaseOrderAction(id: string) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  if (!(await canLogistiqueApprove(user.id))) redirect("/access-denied");

  const result = await updatePurchaseOrderStatus(id, "approved");
  if (!result.success) {
    redirect(`/logistique/achats?error=${encodeURIComponent(result.error ?? "Erreur")}`);
  }
  await revalidateLogistique();
  redirect(
    `/logistique/achats?success=${encodeURIComponent("Commande approuvée.")}`,
  );
}

export async function receivePurchaseOrderAction(id: string) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueWrite(user.id);

  const result = await updatePurchaseOrderStatus(id, "received");
  if (!result.success) {
    redirect(`/logistique/achats?error=${encodeURIComponent(result.error ?? "Erreur")}`);
  }
  await revalidateLogistique();
  redirect(`/logistique/achats?success=${encodeURIComponent("Commande reçue.")}`);
}

export async function cancelPurchaseOrderAction(id: string) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueWrite(user.id);

  const result = await updatePurchaseOrderStatus(id, "cancelled");
  if (!result.success) {
    redirect(`/logistique/achats?error=${encodeURIComponent(result.error ?? "Erreur")}`);
  }
  await revalidateLogistique();
  redirect(`/logistique/achats?success=${encodeURIComponent("Commande annulée.")}`);
}
