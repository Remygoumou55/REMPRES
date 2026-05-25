"use server";

import { redirect } from "next/navigation";
import { revalidateLogistique } from "@/lib/cache/revalidation-map";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertLogistiqueWrite } from "@/lib/server/logistique-access";
import { recordStockMovement } from "@/lib/server/logistique";
import type { MovementType } from "@/lib/types/logistique";

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

export async function recordStockMovementAction(formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueWrite(user.id);

  const type = field(formData, "type") as MovementType;
  const itemId = field(formData, "item_id");
  const result = await recordStockMovement({
    item_id: itemId,
    type,
    quantity: Number(field(formData, "quantity")) || 0,
    reason: field(formData, "reason") || undefined,
    reference: field(formData, "reference") || undefined,
    warehouse_from: field(formData, "warehouse_from") || undefined,
    warehouse_to: field(formData, "warehouse_to") || undefined,
    created_by: user.id,
  });

  if (!result.success) {
    redirect(
      `/logistique/mouvements/new?error=${encodeURIComponent(result.error ?? "Erreur")}${
        itemId ? `&itemId=${itemId}` : ""
      }`,
    );
  }
  await revalidateLogistique();
  redirect(
    `/logistique/mouvements?success=${encodeURIComponent("Mouvement enregistré.")}`,
  );
}
