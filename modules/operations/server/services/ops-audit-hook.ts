import type { Json } from "@/types/database.types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { OPERATIONS_MODULE_KEY } from "@/modules/operations/constants/module-keys";

export async function recordOpsGovernanceAudit(params: {
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
    department_key: OPERATIONS_MODULE_KEY,
    actor_user_id: auth.user?.id ?? null,
    action_type: params.actionType,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    before_snapshot: params.beforeSnapshot ?? null,
    after_snapshot: params.afterSnapshot ?? null,
    metadata: params.metadata ?? {},
  });

  if (error) {
    console.warn("[ops-audit-hook]", error.message);
  }
}
