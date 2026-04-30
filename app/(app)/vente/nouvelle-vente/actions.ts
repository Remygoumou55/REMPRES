"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { z } from "zod";
import { createSale, updatePaymentStatus } from "@/lib/server/sales";
import { resolveErrorMessage } from "@/lib/messages";
import type { CreateSaleInput } from "@/lib/validations/sale";
import type { Client } from "@/types/client";

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
    if (err instanceof z.ZodError) {
      const first = err.issues[0];
      return {
        success: false,
        error: first?.message ?? "Données invalides. Vérifiez le formulaire.",
      };
    }
    return {
      success: false,
      error: resolveErrorMessage(
        err instanceof Error ? err.message : "Erreur inconnue lors de la création de la vente",
      ),
    };
  }
}

// ---------------------------------------------------------------------------
// createQuickClientAction — crée un client "à la volée" depuis le POS
// ---------------------------------------------------------------------------

export async function createQuickClientAction(input: {
  clientType?: "individual" | "company";
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
}): Promise<{ success: true; client: Client } | { success: false; error: string }> {
  const supabase = getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const clientType = input.clientType ?? "individual";

  if (clientType === "company" && !input.companyName?.trim()) {
    return { success: false, error: "Le nom de l'entreprise est obligatoire." };
  }
  if (clientType === "individual" && !input.firstName?.trim()) {
    return { success: false, error: "Le prénom est obligatoire." };
  }
  if (!input.phone?.trim()) {
    return { success: false, error: "Le numéro de téléphone est obligatoire." };
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      client_type:  clientType,
      first_name:   clientType === "individual" ? (input.firstName?.trim() || null) : null,
      last_name:    clientType === "individual" ? (input.lastName?.trim() || null) : null,
      company_name: clientType === "company"    ? (input.companyName?.trim() || null) : null,
      phone:        input.phone.trim() || null,
      email:        input.email?.trim() || null,
      address:      input.address?.trim() || null,
      city:         input.city?.trim() || null,
      created_by:   auth.user.id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: "Impossible de créer le client. Vérifiez les informations." };
  }

  return { success: true, client: data as Client };
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
      error: resolveErrorMessage(
        err instanceof Error ? err.message : "Erreur lors de la mise à jour du statut",
      ),
    };
  }
}
