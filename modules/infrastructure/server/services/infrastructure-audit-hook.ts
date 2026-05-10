import type { Json } from "@/types/database.types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { INFRASTRUCTURE_GOVERNANCE_DEPARTMENT_KEY } from "@/modules/infrastructure/constants/module-keys";

/** Audit plateforme infrastructure → `governance_audit_events`. */
export async function recordInfrastructureGovernanceAudit(params: {
  actionType: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Json;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  const { error } = await supabase.from("governance_audit_events").insert({
    category: "system",
    severity: "informational",
    department_key: INFRASTRUCTURE_GOVERNANCE_DEPARTMENT_KEY,
    actor_user_id: auth.user?.id ?? null,
    action_type: params.actionType,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? {},
  });

  if (error) {
    console.warn("[infrastructure-audit-hook]", error.message);
  }
}
