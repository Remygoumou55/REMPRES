import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { Json } from "@/types/database.types";
import type {
  GovernanceAlert,
  GovernanceAlertSeverity,
  GovernanceAlertStatus,
} from "@/lib/governance/alerts/types";
import type { Database } from "@/types/database.types";

type AlertRow = Database["public"]["Tables"]["governance_alerts"]["Row"];

function toModel(row: AlertRow): GovernanceAlert {
  return {
    id: row.id,
    type: row.type,
    severity: row.severity,
    departmentKey: row.department_key,
    title: row.title,
    description: row.description,
    entityType: row.entity_type,
    entityId: row.entity_id,
    triggeredBy: row.triggered_by,
    status: row.status,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

export async function createGovernanceAlert(input: {
  type: string;
  severity: GovernanceAlertSeverity;
  departmentKey?: string | null;
  title: string;
  description: string;
  entityType?: string | null;
  entityId?: string | null;
  triggeredBy?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("governance_alerts").insert({
    type: input.type,
    severity: input.severity,
    department_key: input.departmentKey ?? null,
    title: input.title,
    description: input.description,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    triggered_by: input.triggeredBy ?? null,
    status: "unread",
    metadata: (input.metadata ?? {}) as Json,
  });
  if (error) {
    throw new Error(`Impossible de creer l'alerte gouvernance: ${error.message}`);
  }
}

export async function listGovernanceAlerts(filters?: {
  status?: GovernanceAlertStatus;
  severity?: GovernanceAlertSeverity;
  departmentKey?: string;
  limit?: number;
}): Promise<GovernanceAlert[]> {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("governance_alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters?.limit ?? 120);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.severity) query = query.eq("severity", filters.severity);
  if (filters?.departmentKey) query = query.eq("department_key", filters.departmentKey);
  const { data, error } = await query;
  if (error) {
    throw new Error(`Impossible de charger les alertes gouvernance: ${error.message}`);
  }
  return (data ?? []).map(toModel);
}

export async function updateGovernanceAlertStatus(input: {
  alertId: string;
  status: GovernanceAlertStatus;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("governance_alerts")
    .update({
      status: input.status,
      resolved_at: input.status === "resolved" ? new Date().toISOString() : null,
    })
    .eq("id", input.alertId);
  if (error) {
    throw new Error(`Impossible de mettre a jour l'alerte: ${error.message}`);
  }
}
