import type { Json } from "@/types/database.types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { HR_MODULE_KEY } from "@/modules/hr/constants/module-keys";

export async function recordHrGovernanceAudit(params: {
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
    department_key: HR_MODULE_KEY,
    actor_user_id: actorId,
    action_type: params.actionType,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    before_snapshot: params.beforeSnapshot ?? null,
    after_snapshot: params.afterSnapshot ?? null,
    metadata: params.metadata ?? {},
  });

  if (error) {
    console.warn("[hr-audit-hook]", error.message);
  }
}
