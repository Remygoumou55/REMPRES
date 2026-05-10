import type { Json } from "@/types/database.types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { AUTOMATION_GOVERNANCE_DEPARTMENT_KEY } from "@/modules/automation/constants/module-keys";

export async function recordAutomationGovernanceAudit(params: {
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
    department_key: AUTOMATION_GOVERNANCE_DEPARTMENT_KEY,
    actor_user_id: auth.user?.id ?? null,
    action_type: params.actionType,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? {},
  });

  if (error) {
    console.warn("[automation-audit-hook]", error.message);
  }
}
