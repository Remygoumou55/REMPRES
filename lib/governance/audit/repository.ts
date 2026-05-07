import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { Database } from "@/types/database.types";
import type {
  GovernanceAuditCategory,
  GovernanceAuditEvent,
  GovernanceAuditSeverity,
} from "@/lib/governance/audit/types";

type AuditRow = Database["public"]["Tables"]["governance_audit_events"]["Row"];

function toObj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function toModel(row: AuditRow): GovernanceAuditEvent {
  return {
    id: row.id,
    category: row.category,
    severity: row.severity,
    departmentKey: row.department_key,
    actorUserId: row.actor_user_id,
    actorRole: row.actor_role,
    actionType: row.action_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    beforeSnapshot: toObj(row.before_snapshot),
    afterSnapshot: toObj(row.after_snapshot),
    metadata: toObj(row.metadata) ?? {},
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  };
}

export async function listGovernanceAuditEvents(params?: {
  page?: number;
  pageSize?: 10 | 25 | 50;
  category?: GovernanceAuditCategory;
  severity?: GovernanceAuditSeverity;
  departmentKey?: string;
  actorUserId?: string;
  query?: string;
}) {
  const page = Number.isInteger(params?.page) && (params?.page ?? 1) > 0 ? (params?.page as number) : 1;
  const pageSize = [10, 25, 50].includes(params?.pageSize as 10 | 25 | 50)
    ? (params?.pageSize as 10 | 25 | 50)
    : 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("governance_audit_events")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);
  if (params?.category) query = query.eq("category", params.category);
  if (params?.severity) query = query.eq("severity", params.severity);
  if (params?.departmentKey) query = query.eq("department_key", params.departmentKey);
  if (params?.actorUserId) query = query.eq("actor_user_id", params.actorUserId);
  if (params?.query) query = query.ilike("action_type", `%${params.query}%`);

  const { data, error, count } = await query;
  if (error) throw new Error(`Impossible de charger les evenements audit: ${error.message}`);
  const total = count ?? 0;
  return {
    data: (data ?? []).map(toModel),
    total,
    page,
    pageSize,
    totalPages: total === 0 ? 1 : Math.ceil(total / pageSize),
  };
}

export async function getComplianceHealth() {
  const supabase = getSupabaseServerClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [criticalRes, securityRes, unresolvedAlertsRes] = await Promise.all([
    supabase
      .from("governance_audit_events")
      .select("id", { count: "exact", head: true })
      .eq("severity", "critical")
      .gte("created_at", since),
    supabase
      .from("governance_audit_events")
      .select("id", { count: "exact", head: true })
      .eq("severity", "security")
      .gte("created_at", since),
    supabase
      .from("governance_alerts")
      .select("id", { count: "exact", head: true })
      .in("status", ["unread", "acknowledged"]),
  ]);

  return {
    criticalEvents7d: criticalRes.count ?? 0,
    securityEvents7d: securityRes.count ?? 0,
    unresolvedAlerts: unresolvedAlertsRes.count ?? 0,
  };
}
