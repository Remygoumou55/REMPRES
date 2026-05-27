"use server";

import { revalidatePath } from "next/cache";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { createNotification } from "@/lib/server/notifications";
import { assertLogistiqueWrite } from "@/lib/server/logistique-access";
import {
  cancelPurchaseOrder,
  confirmPurchaseOrder,
  createPurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderById,
  receivePurchaseOrder,
  updatePurchaseOrder,
} from "@/lib/server/purchase-orders";

type OrderActionResult = { success: boolean; error?: string };

export async function createOrderAction(formData: FormData): Promise<{
  success: boolean;
  id?: string;
  order_number?: string;
  error?: string;
}> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };
  await assertLogistiqueWrite(user.id);

  const supplier_name = String(formData.get("supplier_name") ?? "").trim();
  const supplier_contact = String(formData.get("supplier_contact") ?? "").trim();
  const expected_delivery_date = String(formData.get("expected_delivery_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const itemsRaw = String(formData.get("items") ?? "[]");

  if (!supplier_name) return { success: false, error: "Nom fournisseur requis." };

  let items: Array<{
    stock_item_id?: string | null;
    product_name: string;
    quantity_ordered: number;
    unit_price_gnf: number;
  }> = [];
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    return { success: false, error: "Format articles invalide." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { success: false, error: "Ajoutez au moins un article." };
  }

  const result = await createPurchaseOrder({
    supplier_name,
    supplier_contact: supplier_contact || undefined,
    expected_delivery_date: expected_delivery_date || null,
    notes: notes || undefined,
    created_by: user.id,
    items,
  });

  revalidatePath("/logistique/commandes");
  revalidatePath("/logistique");
  return result;
}

export async function updateOrderAction(
  orderId: string,
  input: {
    supplier_name?: string;
    supplier_contact?: string;
    expected_delivery_date?: string | null;
    notes?: string;
  },
): Promise<OrderActionResult> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };
  await assertLogistiqueWrite(user.id);

  const result = await updatePurchaseOrder(orderId, input);
  revalidatePath("/logistique/commandes");
  revalidatePath(`/logistique/commandes/${orderId}`);
  return result;
}

export async function confirmOrderAction(orderId: string): Promise<OrderActionResult> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };
  await assertLogistiqueWrite(user.id);

  const result = await confirmPurchaseOrder(orderId, user.id);
  if (!result.success) return result;

  const order = await getPurchaseOrderById(orderId);
  const supabase = getSupabaseServerClient();
  const { data: superAdmins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role_key", "super_admin")
    .is("deleted_at", null);

  for (const admin of superAdmins ?? []) {
    await createNotification({
      userId: String(admin.id),
      type: "info",
      title: "Commande confirmée",
      message: `Commande ${order?.order_number ?? orderId} confirmée.`,
      actionUrl: "/logistique/commandes",
    });
  }

  revalidatePath("/logistique/commandes");
  revalidatePath(`/logistique/commandes/${orderId}`);
  return { success: true };
}

export async function receiveOrderAction(orderId: string): Promise<OrderActionResult> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };
  await assertLogistiqueWrite(user.id);

  const result = await receivePurchaseOrder(orderId, user.id);
  if (!result.success) return result;

  const order = await getPurchaseOrderById(orderId);
  const supabase = getSupabaseServerClient();
  const { data: logisticsUsers } = await supabase
    .from("profiles")
    .select("id")
    .eq("role_key", "responsable_logistique")
    .is("deleted_at", null);

  for (const u of logisticsUsers ?? []) {
    await createNotification({
      userId: String(u.id),
      type: "info",
      title: "Réception commande",
      message: `Stock mis à jour — commande ${order?.order_number ?? orderId} reçue.`,
      actionUrl: "/logistique/commandes",
    });
  }

  revalidatePath("/logistique/commandes");
  revalidatePath(`/logistique/commandes/${orderId}`);
  revalidatePath("/logistique");
  revalidatePath("/logistique/articles");
  return { success: true };
}

export async function cancelOrderAction(orderId: string): Promise<OrderActionResult> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };
  await assertLogistiqueWrite(user.id);

  const result = await cancelPurchaseOrder(orderId);
  revalidatePath("/logistique/commandes");
  revalidatePath(`/logistique/commandes/${orderId}`);
  return result;
}

export async function deleteOrderAction(orderId: string): Promise<OrderActionResult> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };
  await assertLogistiqueWrite(user.id);

  const result = await deletePurchaseOrder(orderId);
  revalidatePath("/logistique/commandes");
  return result;
}
