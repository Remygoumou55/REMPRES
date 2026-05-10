import type { Json } from "@/types/database.types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { CRM_GOVERNANCE_DEPARTMENT_KEY } from "@/modules/crm/constants/module-keys";

/** Audit métier CRM → `governance_audit_events` (catégorie mutation). */
export async function recordCrmGovernanceAudit(params: {
  actionType: string;
  entityType?: string | null;
  entityId?: string | null;
  beforeSnapshot?: Json | null;
  afterSnapshot?: Json | null;
  metadata?: Json;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  const { error } = await supabase.from("governance_audit_events").insert({
    category: "mutation",
    severity: "informational",
    department_key: CRM_GOVERNANCE_DEPARTMENT_KEY,
    actor_user_id: auth.user?.id ?? null,
    action_type: params.actionType,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    before_snapshot: params.beforeSnapshot ?? null,
    after_snapshot: params.afterSnapshot ?? null,
    metadata: params.metadata ?? {},
  });

  if (error) {
    console.warn("[crm-audit-hook]", error.message);
  }
}
