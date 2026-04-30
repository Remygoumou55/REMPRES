"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions } from "@/lib/server/permissions";
import { ok, err, type SafeResult } from "@/lib/server/safe-result";
import { mapArchiveSaleError } from "@/lib/server/sale-error-messages";

const MODULE_KEYS = ["produits", "vente"] as const;

/**
 * Archive la vente (sales_archive + raw_data) puis soft delete (sales.deleted_at).
 * Logique atomique côté base via RPC public.archive_and_soft_delete_sale.
 */
export async function archiveAndDeleteSaleAction(saleId: string): Promise<SafeResult<null>> {
  const id = (saleId ?? "").trim();
  if (!id) {
    return err("Vente invalide.");
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

  const { error } = await supabase.rpc("archive_and_soft_delete_sale", { p_sale_id: id });

  if (error) {
    return err(
      mapArchiveSaleError(error.message, "Impossible d'archiver ou supprimer la vente pour le moment."),
    );
  }

  revalidatePath("/vente/historique");
  revalidatePath(`/vente/historique/${id}`);
  return ok(null);
}
