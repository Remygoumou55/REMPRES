import { unstable_cache } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { ADMIN_PLATFORM_DASHBOARD_CACHE_TAGS } from "@/modules/admin-platform-dashboard/constants";

const ADMIN_SCOPE_KEY = "admin_platform_v1";
const SNAPSHOT_MAX_AGE_SEC = 10 * 60;
const CACHE_REVALIDATE_SEC = 60;

type TenantScope = { tenantIds: string[] | null; scoped: boolean; scopeHash: string };

function asCount(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function isFresh(iso: string, maxAgeSec: number): boolean {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= maxAgeSec * 1000;
}

async function resolveTenantScope(userId: string, elevated: boolean): Promise<TenantScope> {
  if (elevated) return { tenantIds: null, scoped: false, scopeHash: "global" };
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("erp_tenant_memberships")
    .select("tenant_id")
    .eq("user_id", userId);
  if (error || !data?.length) return { tenantIds: [], scoped: true, scopeHash: "none" };
  const tenantIds = Array.from(new Set(data.map((x) => String(x.tenant_id))));
  return { tenantIds, scoped: true, scopeHash: tenantIds.slice().sort().join(",") };
}

export type AdminPlatformAggregates = {
  jobsPending: number;
  jobsFailed24h: number;
  incidentsOpen: number;
  anomaliesOpen: number;
  riskSignalsOpen: number;
  tenantsActive: number;
  tenantSnapshots: number;
  scopeHash: string;
};

async function readStoredSnapshot(scope: TenantScope): Promise<AdminPlatformAggregates | null> {
  const supabase = getSupabaseServerClient();
  if (!scope.tenantIds) {
    const { data, error } = await supabase
      .from("erp_analytics_snapshots")
      .select("payload, computed_at")
      .eq("scope_key", ADMIN_SCOPE_KEY)
      .maybeSingle();
    if (error || !data || !isFresh(data.computed_at, SNAPSHOT_MAX_AGE_SEC)) return null;
    const payload = data.payload as Partial<AdminPlatformAggregates>;
    if (!payload || payload.scopeHash !== scope.scopeHash) return null;
    return {
      jobsPending: asCount(payload.jobsPending),
      jobsFailed24h: asCount(payload.jobsFailed24h),
      incidentsOpen: asCount(payload.incidentsOpen),
      anomaliesOpen: asCount(payload.anomaliesOpen),
      riskSignalsOpen: asCount(payload.riskSignalsOpen),
      tenantsActive: asCount(payload.tenantsActive),
      tenantSnapshots: asCount(payload.tenantSnapshots),
      scopeHash: String(payload.scopeHash ?? scope.scopeHash),
    };
  }
  if (scope.tenantIds.length === 1) {
    const { data, error } = await supabase
      .from("erp_tenant_analytics_snapshots")
      .select("payload, computed_at")
      .eq("tenant_id", scope.tenantIds[0])
      .eq("scope_key", ADMIN_SCOPE_KEY)
      .maybeSingle();
    if (error || !data || !isFresh(data.computed_at, SNAPSHOT_MAX_AGE_SEC)) return null;
    const payload = data.payload as Partial<AdminPlatformAggregates>;
    if (!payload || payload.scopeHash !== scope.scopeHash) return null;
    return {
      jobsPending: asCount(payload.jobsPending),
      jobsFailed24h: asCount(payload.jobsFailed24h),
      incidentsOpen: asCount(payload.incidentsOpen),
      anomaliesOpen: asCount(payload.anomaliesOpen),
      riskSignalsOpen: asCount(payload.riskSignalsOpen),
      tenantsActive: asCount(payload.tenantsActive),
      tenantSnapshots: asCount(payload.tenantSnapshots),
      scopeHash: String(payload.scopeHash ?? scope.scopeHash),
    };
  }
  return null;
}

async function computeLiveAggregates(scope: TenantScope): Promise<AdminPlatformAggregates> {
  const supabase = getSupabaseServerClient();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [pending, failed, incidents, anomalies, risks, tenants, snapshots] = await Promise.all([
    (scope.tenantIds
      ? supabase
          .from("erp_infrastructure_jobs")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .in("tenant_id", scope.tenantIds)
      : supabase.from("erp_infrastructure_jobs").select("id", { count: "exact", head: true }).eq("status", "pending")),
    (scope.tenantIds
      ? supabase
          .from("erp_infrastructure_jobs")
          .select("id", { count: "exact", head: true })
          .eq("status", "failed")
          .gte("updated_at", since24h)
          .in("tenant_id", scope.tenantIds)
      : supabase
          .from("erp_infrastructure_jobs")
          .select("id", { count: "exact", head: true })
          .eq("status", "failed")
          .gte("updated_at", since24h)),
    supabase.from("erp_observability_incidents").select("id", { count: "exact", head: true }).in("status", ["open", "investigating"]),
    supabase.from("erp_observability_anomalies").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("erp_compliance_risk_signals").select("id", { count: "exact", head: true }).eq("status", "open"),
    (scope.tenantIds
      ? supabase.from("erp_tenants").select("id", { count: "exact", head: true }).in("id", scope.tenantIds).eq("status", "active")
      : supabase.from("erp_tenants").select("id", { count: "exact", head: true }).eq("status", "active")),
    (scope.tenantIds
      ? supabase
          .from("erp_tenant_analytics_snapshots")
          .select("tenant_id", { count: "exact", head: true })
          .in("tenant_id", scope.tenantIds)
      : supabase.from("erp_tenant_analytics_snapshots").select("tenant_id", { count: "exact", head: true })),
  ]);

  const payload: AdminPlatformAggregates = {
    jobsPending: asCount(pending.count),
    jobsFailed24h: asCount(failed.count),
    incidentsOpen: asCount(incidents.count),
    anomaliesOpen: asCount(anomalies.count),
    riskSignalsOpen: asCount(risks.count),
    tenantsActive: asCount(tenants.count),
    tenantSnapshots: asCount(snapshots.count),
    scopeHash: scope.scopeHash,
  };

  if (!scope.tenantIds) {
    await supabase
      .from("erp_analytics_snapshots")
      .upsert({ scope_key: ADMIN_SCOPE_KEY, payload, computed_at: new Date().toISOString() }, { onConflict: "scope_key" });
  } else if (scope.tenantIds.length === 1) {
    await supabase.from("erp_tenant_analytics_snapshots").upsert({
      tenant_id: scope.tenantIds[0],
      scope_key: ADMIN_SCOPE_KEY,
      payload,
      computed_at: new Date().toISOString(),
    });
  }

  return payload;
}

export async function getAdminPlatformAggregates(args: {
  viewerUserId: string;
  elevated: boolean;
}): Promise<AdminPlatformAggregates> {
  const scope = await resolveTenantScope(args.viewerUserId, args.elevated);
  return unstable_cache(
    async () => {
      const fromSnapshot = await readStoredSnapshot(scope);
      if (fromSnapshot) return fromSnapshot;
      return computeLiveAggregates(scope);
    },
    ["admin-platform", "aggregates", args.viewerUserId, scope.scopeHash, args.elevated ? "elevated" : "standard"],
    {
      revalidate: CACHE_REVALIDATE_SEC,
      tags: [ADMIN_PLATFORM_DASHBOARD_CACHE_TAGS.root, ADMIN_PLATFORM_DASHBOARD_CACHE_TAGS.hub],
    },
  )();
}
