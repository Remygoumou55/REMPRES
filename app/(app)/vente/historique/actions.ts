"use server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { assertOperationalMutationAllowed } from "@/lib/server/auth-operational-guards";
import { getModulePermissions, getUserRole } from "@/lib/server/permissions";
import { ok, err, type SafeResult } from "@/lib/server/safe-result";
import { mapArchiveSaleError } from "@/lib/server/sale-error-messages";
import { revalidateVente } from "@/lib/cache/revalidation-map";
import { AUDIT_EVENT_TYPES } from "@/lib/audit/audit-events";
import { tryLogAuditEvent } from "@/lib/audit/audit-logger";
import { assertApprovalOrThrow } from "@/lib/approvals/approval-engine";
import { isApprovalRequiredError } from "@/lib/governance/approvals/workflow";

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

  try {
    await assertOperationalMutationAllowed(data.user.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Accès refusé.";
    return err(msg);
  }

  const actorRole = await getUserRole(data.user.id);
  let approval: Awaited<ReturnType<typeof assertApprovalOrThrow>>;
  try {
    approval = await assertApprovalOrThrow({
      eventType: AUDIT_EVENT_TYPES.SALE_DELETED,
      actorUserId: data.user.id,
      actorRole,
      departmentKey: "VENTE",
      metadata: { entity_type: "sales", entity_id: id, operation: "archive_and_soft_delete_sale" },
    });
  } catch (e) {
    if (isApprovalRequiredError(e)) return err(e.message);
    return err("Action bloquee par la gouvernance d'approbation.");
  }

  const { error } = await supabase.rpc("archive_and_soft_delete_sale", { p_sale_id: id });

  if (error) {
    return err(
      mapArchiveSaleError(error.message, "Impossible d'archiver ou supprimer la vente pour le moment."),
    );
  }

  await tryLogAuditEvent({
    eventType: AUDIT_EVENT_TYPES.SALE_DELETED,
    severity: "critical",
    target: { table: "sales", id },
    context: { actorUserId: data.user.id, actorRole },
    details: { operation: "archive_and_soft_delete_sale" },
    approval: { required: approval.required, status: "granted", policy: approval.policy },
  });

  await revalidateVente({ saleId: id });
  return ok(null);
}
