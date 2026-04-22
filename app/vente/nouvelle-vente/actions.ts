"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { createSale, updatePaymentStatus } from "@/lib/server/sales";
import type { CreateSaleInput } from "@/lib/validations/sale";

// ---------------------------------------------------------------------------
// createSaleAction — appelée depuis NouvelleVenteClient
// ---------------------------------------------------------------------------

type CreateSalePayload = Omit<CreateSaleInput, "sellerId">;

export async function createSaleAction(
  payload: CreateSalePayload,
): Promise<
  | { success: true; sale: { id: string; reference: string | null; total_amount_gnf: number } }
  | { success: false; error: string }
> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const headersList = headers();
  const context = {
    ip: headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip"),
    userAgent: headersList.get("user-agent"),
  };

  try {
    const sale = await createSale(
      { ...payload, sellerId: data.user.id },
      data.user.id,
      context,
    );
    return {
      success: true,
      sale: { id: sale.id, reference: sale.reference, total_amount_gnf: sale.total_amount_gnf },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur inconnue lors de la création de la vente",
    };
  }
}

// ---------------------------------------------------------------------------
// markAsPaidAction — appelée depuis la page historique
// ---------------------------------------------------------------------------

export async function markAsPaidAction(
  saleId: string,
  totalAmountGNF: number,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const headersList = headers();
  const context = {
    ip: headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip"),
    userAgent: headersList.get("user-agent"),
  };

  try {
    await updatePaymentStatus(saleId, "paid", totalAmountGNF, data.user.id, context);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du statut",
    };
  }
}
