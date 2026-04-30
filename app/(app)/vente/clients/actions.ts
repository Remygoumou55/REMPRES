"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { assertClientsPermission } from "@/lib/server/permissions";
import { softDeleteClient, restoreClient } from "@/lib/server/clients";
import { ok, err, type SafeResult } from "@/lib/server/safe-result";
import { mapClientError } from "@/lib/server/client-error-messages";

/**
 * Suppression logique d'un client depuis la liste (/vente/clients).
 */
export async function deleteClientFromListAction(clientId: string): Promise<SafeResult<null>> {
  const id = (clientId ?? "").trim();
  if (!id) {
    return err("Client invalide.");
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    return err("Non authentifié.");
  }

  const userId = data.user.id;
  const allowed = await assertClientsPermission(userId, "delete");
  if (!allowed) {
    return err("Accès refusé: vous n'avez pas la permission pour cette action.");
  }

  try {
    const requestHeaders = headers();
    await softDeleteClient(id, userId, {
      ip: requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip"),
      userAgent: requestHeaders.get("user-agent"),
    });
  } catch (e) {
    return err(mapClientError(e, "Impossible de supprimer le client pour le moment."));
  }

  revalidatePath("/vente/clients");
  revalidatePath(`/vente/clients/${id}`);
  return ok(null);
}

/**
 * Suppression logique multiple depuis la liste clients.
 */
export async function deleteClientsFromListBulkAction(clientIds: string[]): Promise<SafeResult<{ deleted: number }>> {
  const ids = Array.from(new Set((clientIds ?? []).map((id) => id.trim()).filter(Boolean)));
  if (ids.length === 0) {
    return err("Aucun client sélectionné.");
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    return err("Non authentifié.");
  }

  const userId = data.user.id;
  const allowed = await assertClientsPermission(userId, "delete");
  if (!allowed) {
    return err("Accès refusé: vous n'avez pas la permission pour cette action.");
  }

  let deleted = 0;
  const requestHeaders = headers();
  for (const id of ids) {
    try {
      await softDeleteClient(id, userId, {
        ip: requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip"),
        userAgent: requestHeaders.get("user-agent"),
      });
      deleted += 1;
    } catch {
      // On continue pour supprimer le maximum d'éléments possible.
    }
  }

  if (deleted === 0) {
    return err("Aucun client n'a pu être supprimé.");
  }

  revalidatePath("/vente/clients");
  return ok({ deleted });
}

/**
 * Restauration depuis les archives (/vente/clients/archives).
 */
export async function restoreClientAction(clientId: string): Promise<SafeResult<null>> {
  const id = (clientId ?? "").trim();
  if (!id) {
    return err("Client invalide.");
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    return err("Non authentifié.");
  }

  const userId = data.user.id;
  const allowed = await assertClientsPermission(userId, "delete");
  if (!allowed) {
    return err("Accès refusé: vous n'avez pas la permission pour cette action.");
  }

  try {
    const requestHeaders = headers();
    await restoreClient(id, userId, {
      ip: requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip"),
      userAgent: requestHeaders.get("user-agent"),
    });
  } catch (e) {
    return err(mapClientError(e, "Impossible de restaurer le client pour le moment."));
  }

  revalidatePath("/vente/clients/archives");
  revalidatePath("/admin/archives");
  revalidatePath("/vente/clients");
  revalidatePath(`/vente/clients/${id}`);
  return ok(null);
}
