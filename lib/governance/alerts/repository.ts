import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { Json } from "@/types/database.types";
import type {
  GovernanceAlertCategory,
  GovernanceAlertEscalation,
  GovernanceAlert,
  GovernanceAlertSeverity,
  GovernanceAlertStatus,
} from "@/lib/governance/alerts/types";
import type { Database } from "@/types/database.types";

type AlertRow = Database["public"]["Tables"]["governance_alerts"]["Row"];

function toModel(row: AlertRow): GovernanceAlert {
  const metadata =
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : {};
  const category = String(metadata.alert_category ?? "SYSTEM").toUpperCase() as GovernanceAlertCategory;
  const escalation = String(metadata.escalation ?? "manager_and_dg") as GovernanceAlertEscalation;
  const archived = metadata.archived === true;
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
    category,
    escalation,
    metadata,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    lifecycleStatus: archived ? "archived" : row.status,
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
  category?: GovernanceAlertCategory;
  escalation?: GovernanceAlertEscalation;
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
    metadata: ({
      ...(input.metadata ?? {}),
      alert_category: input.category ?? "SYSTEM",
      escalation: input.escalation ?? "manager_and_dg",
    } satisfies Record<string, unknown>) as Json,
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
    .order("id", { ascending: false })
    .limit(filters?.limit ?? 120);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.severity) query = query.eq("severity", filters.severity);
  if (filters?.departmentKey) query = query.eq("department_key", filters.departmentKey);
  const { data, error } = await query;
  if (error) {
    throw new Error(`Impossible de charger les alertes gouvernance: ${error.message}`);
  }
  const mapped = (data ?? []).map(toModel);
  return mapped.filter((row) => row.lifecycleStatus !== "archived");
}

export async function findRecentSimilarAlert(input: {
  type: string;
  departmentKey?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  lookbackMinutes?: number;
}): Promise<GovernanceAlert | null> {
  const supabase = getSupabaseServerClient();
  const since = new Date(Date.now() - (input.lookbackMinutes ?? 5) * 60 * 1000).toISOString();
  let query = supabase
    .from("governance_alerts")
    .select("*")
    .eq("type", input.type)
    .gte("created_at", since)
    .in("status", ["unread", "acknowledged"])
    .order("created_at", { ascending: false })
    .limit(1);
  if (input.departmentKey) query = query.eq("department_key", input.departmentKey);
  if (input.entityType) query = query.eq("entity_type", input.entityType);
  if (input.entityId) query = query.eq("entity_id", input.entityId);
  const { data, error } = await query.maybeSingle();
  if (error) return null;
  return data ? toModel(data) : null;
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

export async function archiveGovernanceAlert(input: {
  alertId: string;
  actorUserId: string;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data: current, error: readError } = await supabase
    .from("governance_alerts")
    .select("metadata")
    .eq("id", input.alertId)
    .maybeSingle();
  if (readError) {
    throw new Error(`Impossible de charger l'alerte: ${readError.message}`);
  }
  const currentMetadata =
    current?.metadata && typeof current.metadata === "object"
      ? (current.metadata as Record<string, unknown>)
      : {};
  const { error } = await supabase
    .from("governance_alerts")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      metadata: ({
        ...currentMetadata,
        lifecycle: "archived",
        archived: true,
        archived_at: new Date().toISOString(),
        archived_by: input.actorUserId,
      } satisfies Record<string, unknown>) as Json,
    })
    .eq("id", input.alertId);
  if (error) {
    throw new Error(`Impossible d'archiver l'alerte: ${error.message}`);
  }
}
