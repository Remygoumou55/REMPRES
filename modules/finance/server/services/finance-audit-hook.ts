import type { Json } from "@/types/database.types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { FINANCE_MODULE_KEY } from "@/modules/finance/constants/module-keys";

/**
 * Point d’extension audit finance → `governance_audit_events` (catégorie mutation).
 * À appeler après mutations métier sensibles (écritures, factures, budgets).
 */
export async function recordFinanceGovernanceAudit(params: {
  actionType: string;
  entityType?: string | null;
  entityId?: string | null;
  beforeSnapshot?: Json | null;
  afterSnapshot?: Json | null;
  metadata?: Json;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const actorId = auth.user?.id ?? null;

  const { error } = await supabase.from("governance_audit_events").insert({
    category: "mutation",
    severity: "informational",
    department_key: FINANCE_MODULE_KEY,
    actor_user_id: actorId,
    action_type: params.actionType,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    before_snapshot: params.beforeSnapshot ?? null,
    after_snapshot: params.afterSnapshot ?? null,
    metadata: params.metadata ?? {},
  });

  if (error) {
    console.warn("[finance-audit-hook]", error.message);
  }
}
