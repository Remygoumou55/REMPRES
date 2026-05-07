import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { Json } from "@/types/database.types";
import type {
  GovernanceAuditCategory,
  GovernanceAuditSeverity,
} from "@/lib/governance/audit/types";

function toJson(input: Record<string, unknown> | null | undefined): Json | null {
  if (!input) return null;
  return input as Json;
}

export async function logGovernanceAuditEvent(input: {
  category: GovernanceAuditCategory;
  severity: GovernanceAuditSeverity;
  departmentKey?: string | null;
  actorUserId?: string | null;
  actorRole?: string | null;
  actionType: string;
  entityType?: string | null;
  entityId?: string | null;
  beforeSnapshot?: Record<string, unknown> | null;
  afterSnapshot?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("governance_audit_events").insert({
    category: input.category,
    severity: input.severity,
    department_key: input.departmentKey ?? null,
    actor_user_id: input.actorUserId ?? null,
    actor_role: input.actorRole ?? null,
    action_type: input.actionType,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    before_snapshot: toJson(input.beforeSnapshot),
    after_snapshot: toJson(input.afterSnapshot),
    metadata: (input.metadata ?? {}) as Json,
    ip_address: input.ipAddress ?? null,
    user_agent: input.userAgent ?? null,
  });
  if (error) {
    throw new Error(`Impossible d'ecrire l'audit gouvernance: ${error.message}`);
  }
}

export async function tryLogGovernanceAuditEvent(input: {
  category: GovernanceAuditCategory;
  severity: GovernanceAuditSeverity;
  departmentKey?: string | null;
  actorUserId?: string | null;
  actorRole?: string | null;
  actionType: string;
  entityType?: string | null;
  entityId?: string | null;
  beforeSnapshot?: Record<string, unknown> | null;
  afterSnapshot?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await logGovernanceAuditEvent(input);
  } catch {
    // no-op: audit logging must not break business flow
  }
}
