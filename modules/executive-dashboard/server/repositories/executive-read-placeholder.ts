import { cache } from "react";
import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { ExecutiveGlobalSnapshot } from "@/modules/executive-dashboard/types/domain";
import { createExecutiveCorrelationId } from "@/modules/executive-dashboard/utils/correlation";

const EXECUTIVE_SCOPE_KEY = "executive_global_v1";
const SNAPSHOT_MAX_AGE_SEC = 10 * 60;

type TenantScope = { tenantIds: string[] | null; scopeHash: string };

function isoNow(): string {
  return new Date().toISOString();
}

function isFresh(iso: string, maxAgeSec: number): boolean {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= maxAgeSec * 1000;
}

function toCount(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function toCurrency(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

async function resolveTenantScope(userId: string, elevated: boolean): Promise<TenantScope> {
  if (elevated) return { tenantIds: null, scopeHash: "global" };
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("erp_tenant_memberships")
    .select("tenant_id")
    .eq("user_id", userId);
  if (error || !data?.length) return { tenantIds: [], scopeHash: "none" };
  const tenantIds = Array.from(new Set(data.map((x) => String(x.tenant_id))));
  return { tenantIds, scopeHash: tenantIds.slice().sort().join(",") };
}

function buildPlaceholderDomain(source: string): DeptKpiPayload {
  return {
    stats: [],
    charts: [],
    alerts: [],
    activity: [],
    health: { status: "placeholder", notes: ["dashboard.dept.health.placeholder"] },
    metadata: { source, generatedAt: isoNow(), placeholder: true },
  };
}

async function buildLiveExecutiveSnapshot(args: {
  tenantIds: string[] | null;
  scopeHash: string;
}): Promise<ExecutiveGlobalSnapshot> {
  const supabase = getSupabaseServerClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekStart = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();

  const [salesMonth, expensesMonth, clientsCount, productsCount, rhContractsActive, rhRecruitmentOpen, crmLeadsOpen, crmOppOpen, whCount, inventoryRows, poOpen, suppliersActive, incidentOpen, jobsPending, jobsFailed, tenantActive, tenantSnapshots] =
    await Promise.all([
      supabase.from("sales").select("total_amount_gnf", { count: "exact" }).gte("created_at", monthStart),
      supabase.from("expenses").select("amount_gnf", { count: "exact" }).gte("created_at", monthStart),
      supabase.from("clients").select("id", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("products").select("id", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("rh_employee_contracts").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase
        .from("rh_recruitment_candidates")
        .select("id", { count: "exact", head: true })
        .in("pipeline_stage", ["sourced", "screening", "interview", "offer", "pending_hire_approval"]),
      supabase.from("crm_leads").select("id", { count: "exact", head: true }).in("status", ["new", "contacted", "qualified"]),
      supabase.from("crm_opportunities").select("id", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("logistics_warehouses").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("logistics_inventory_balances").select("qty_on_hand, updated_at"),
      supabase
        .from("logistics_purchase_orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["submitted", "approved", "partially_received"]),
      supabase.from("logistics_suppliers").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("erp_observability_incidents").select("id", { count: "exact", head: true }).in("status", ["open", "investigating"]),
      (args.tenantIds
        ? supabase
            .from("erp_infrastructure_jobs")
            .select("id", { count: "exact", head: true })
            .in("status", ["pending", "processing"])
            .in("tenant_id", args.tenantIds)
        : supabase
            .from("erp_infrastructure_jobs")
            .select("id", { count: "exact", head: true })
            .in("status", ["pending", "processing"])),
      (args.tenantIds
        ? supabase
            .from("erp_infrastructure_jobs")
            .select("id", { count: "exact", head: true })
            .eq("status", "failed")
            .gte("updated_at", weekStart)
            .in("tenant_id", args.tenantIds)
        : supabase
            .from("erp_infrastructure_jobs")
            .select("id", { count: "exact", head: true })
            .eq("status", "failed")
            .gte("updated_at", weekStart)),
      (args.tenantIds
        ? supabase.from("erp_tenants").select("id", { count: "exact", head: true }).in("id", args.tenantIds).eq("status", "active")
        : supabase.from("erp_tenants").select("id", { count: "exact", head: true }).eq("status", "active")),
      (args.tenantIds
        ? supabase
            .from("erp_tenant_analytics_snapshots")
            .select("tenant_id", { count: "exact", head: true })
            .in("tenant_id", args.tenantIds)
        : supabase.from("erp_tenant_analytics_snapshots").select("tenant_id", { count: "exact", head: true })),
    ]);

  const revenue = (salesMonth.data ?? []).reduce((sum, x) => sum + toCurrency(x.total_amount_gnf), 0);
  const expenses = (expensesMonth.data ?? []).reduce((sum, x) => sum + toCurrency(x.amount_gnf), 0);
  const inventoryTotal = (inventoryRows.data ?? []).reduce((sum, x) => sum + toCount(x.qty_on_hand), 0);
  const correlationId = createExecutiveCorrelationId();

  const finance: DeptKpiPayload = {
    stats: [
      { id: "revenue", label: "dashboard.dept.kpi.totalRevenueMonth", value: revenue, unit: "currency" },
      { id: "expenses", label: "dashboard.dept.kpi.totalExpensesMonth", value: expenses, unit: "currency" },
      { id: "margin", label: "dashboard.dept.kpi.netMargin", value: revenue - expenses, unit: "currency" },
      { id: "transactions", label: "dashboard.dept.kpi.transactions", value: toCount(salesMonth.count) + toCount(expensesMonth.count), unit: "count" },
    ],
    charts: [],
    alerts: [],
    activity: [],
    health: { status: "ok" },
    metadata: { source: "finance_sql_aggregates", generatedAt: isoNow(), placeholder: false },
  };

  const vente: DeptKpiPayload = {
    stats: [
      { id: "clients", label: "dashboard.dept.kpi.clients", value: toCount(clientsCount.count), unit: "count" },
      { id: "products", label: "dashboard.dept.kpi.products", value: toCount(productsCount.count), unit: "count" },
      { id: "salesThisMonth", label: "dashboard.dept.kpi.salesThisMonth", value: revenue, unit: "currency" },
      { id: "openLeads", label: "crm.dashboard.kpi.leads", value: toCount(crmLeadsOpen.count), unit: "count" },
    ],
    charts: [],
    alerts: [],
    activity: [],
    health: { status: "ok" },
    metadata: { source: "sales_sql_aggregates", generatedAt: isoNow(), placeholder: false },
  };

  const rh: DeptKpiPayload = {
    stats: [
      { id: "activeContracts", label: "rh.dashboard.kpi.activeContracts", value: toCount(rhContractsActive.count), unit: "count" },
      { id: "recruitmentOpen", label: "rh.dashboard.kpi.recruitmentOpen", value: toCount(rhRecruitmentOpen.count), unit: "count" },
      { id: "tenantActive", label: "executive.kpi.activeTenants", value: toCount(tenantActive.count), unit: "count" },
      { id: "tenantSnapshots", label: "executive.kpi.tenantSnapshots", value: toCount(tenantSnapshots.count), unit: "count" },      
    ],
    charts: [],
    alerts: [],
    activity: [],
    health: { status: "ok" },
    metadata: { source: "rh_sql_aggregates", generatedAt: isoNow(), placeholder: false },
  };

  const logistique: DeptKpiPayload = {
    stats: [
      { id: "warehouses", label: "logistics.dashboard.kpi.warehouses", value: toCount(whCount.count), unit: "count" },
      { id: "inventory", label: "logistics.dashboard.kpi.inventory", value: inventoryTotal, unit: "count" },
      { id: "purchaseOrders", label: "logistics.dashboard.kpi.pendingOrders", value: toCount(poOpen.count), unit: "count" },
      { id: "suppliers", label: "logistics.dashboard.kpi.suppliers", value: toCount(suppliersActive.count), unit: "count" },
      { id: "openIncidents", label: "executive.kpi.openIncidents", value: toCount(incidentOpen.count), unit: "count" },
      { id: "openOpportunities", label: "crm.dashboard.kpi.opportunities", value: toCount(crmOppOpen.count), unit: "count" },
      { id: "jobsPending", label: "admin.platformDashboard.metric.jobsPending", value: toCount(jobsPending.count), unit: "count" },
      { id: "jobsFailed24h", label: "admin.platformDashboard.metric.jobsFailed24h", value: toCount(jobsFailed.count), unit: "count" },
    ],
    charts: [],
    alerts: [],
    activity: [],
    health: { status: "ok" },
    metadata: { source: "logistics_sql_aggregates", generatedAt: isoNow(), placeholder: false },
  };

  const domains: ExecutiveGlobalSnapshot["domains"] = {
    vente,
    finance,
    rh,
    logistique,
    formation: buildPlaceholderDomain("formation"),
    consultation: buildPlaceholderDomain("consultation"),
    marketing: buildPlaceholderDomain("marketing"),
  };

  const snapshot: ExecutiveGlobalSnapshot = {
    id: "executive_global_v1",
    domains,
    meta: {
      engineVersion: "1.1.0",
      correlationId,
      generatedAtIso: isoNow(),
    },
    executiveMeta: {
      correlationId,
      domainsLoaded: 4,
      domainsFailed: 0,
    },
  };

  const payload = {
    ...snapshot,
    scopeHash: args.scopeHash,
  };

  if (!args.tenantIds) {
    await supabase
      .from("erp_analytics_snapshots")
      .upsert({ scope_key: EXECUTIVE_SCOPE_KEY, payload, computed_at: isoNow() }, { onConflict: "scope_key" });
  } else if (args.tenantIds.length === 1) {
    await supabase.from("erp_tenant_analytics_snapshots").upsert({
      tenant_id: args.tenantIds[0],
      scope_key: EXECUTIVE_SCOPE_KEY,
      payload,
      computed_at: isoNow(),
    });
  }

  return snapshot;
}

async function loadExecutiveSnapshotFromStore(args: {
  tenantIds: string[] | null;
  scopeHash: string;
}): Promise<ExecutiveGlobalSnapshot | null> {
  const supabase = getSupabaseServerClient();
  if (!args.tenantIds) {
    const { data, error } = await supabase
      .from("erp_analytics_snapshots")
      .select("payload, computed_at")
      .eq("scope_key", EXECUTIVE_SCOPE_KEY)
      .maybeSingle();
    if (error || !data || !isFresh(data.computed_at, SNAPSHOT_MAX_AGE_SEC)) return null;
    const payload = data.payload as Partial<ExecutiveGlobalSnapshot> & { scopeHash?: string };
    if (payload.scopeHash !== args.scopeHash) return null;
    if (!payload.id || !payload.executiveMeta || !payload.meta) return null;
    return payload as ExecutiveGlobalSnapshot;
  }
  if (args.tenantIds.length === 1) {
    const { data, error } = await supabase
      .from("erp_tenant_analytics_snapshots")
      .select("payload, computed_at")
      .eq("tenant_id", args.tenantIds[0])
      .eq("scope_key", EXECUTIVE_SCOPE_KEY)
      .maybeSingle();
    if (error || !data || !isFresh(data.computed_at, SNAPSHOT_MAX_AGE_SEC)) return null;
    const payload = data.payload as Partial<ExecutiveGlobalSnapshot> & { scopeHash?: string };
    if (payload.scopeHash !== args.scopeHash) return null;
    if (!payload.id || !payload.executiveMeta || !payload.meta) return null;
    return payload as ExecutiveGlobalSnapshot;
  }
  return null;
}

export async function getExecutiveGlobalSnapshot(args: {
  viewerUserId: string;
  elevated: boolean;
}): Promise<ExecutiveGlobalSnapshot> {
  return loadExecutiveGlobalSnapshot(args.viewerUserId, args.elevated);
}

const loadExecutiveGlobalSnapshot = cache(
  async (viewerUserId: string, elevated: boolean): Promise<ExecutiveGlobalSnapshot> => {
    const scope = await resolveTenantScope(viewerUserId, elevated);
    const fromSnapshot = await loadExecutiveSnapshotFromStore(scope);
    if (fromSnapshot) return fromSnapshot;
    return buildLiveExecutiveSnapshot(scope);
  },
);
