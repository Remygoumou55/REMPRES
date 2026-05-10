import type { Json } from "@/types/database.types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { RESILIENCE_MODULE_KEY } from "@/modules/resilience/constants/module-keys";

export async function recordResilienceGovernanceAudit(params: {
  actionType: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Json;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  const { error } = await supabase.from("governance_audit_events").insert({
    category: "governance",
    severity: "informational",
    department_key: "ADMINISTRATION",
    actor_user_id: auth.user?.id ?? null,
    action_type: params.actionType,
    entity_type: params.entityType ?? RESILIENCE_MODULE_KEY,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? {},
  });

  if (error) {
    console.warn("[resilience-governance-audit]", error.message);
  }
}
