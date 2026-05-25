import { cache } from "react";
import { format, startOfMonth, subMonths } from "date-fns";
import type { DeptKpiChart, DeptKpiPayload } from "@/lib/dept/kpi-contract";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { emitExecutiveSnapshotRefreshed } from "@/lib/erp-core/events/integrations/executive-events";
import type { ExecutiveGlobalSnapshot } from "@/modules/executive-dashboard/types/domain";
import { createExecutiveCorrelationId } from "@/modules/executive-dashboard/utils/correlation";
import { getOperationsOperationalOverview } from "@/modules/operations/server/services/ops-overview";

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

async function buildRevenueTrendChart(
  supabase: ReturnType<typeof getSupabaseServerClient>,
): Promise<DeptKpiChart> {
  const points: DeptKpiChart["points"] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const start = startOfMonth(subMonths(now, i));
    const end = startOfMonth(subMonths(now, i - 1));
    const { data } = await supabase
      .from("sales")
      .select("total_amount_gnf")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString());
    const total = (data ?? []).reduce((s, r) => s + toCurrency(r.total_amount_gnf), 0);
    points.push({ x: format(start, "yyyy-MM"), revenue: Math.round(total) });
  }
  return {
    id: "revenue_trend_6m",
    title: "executive.chart.revenueTrend",
    kind: "area",
    xKey: "x",
    series: [{ key: "revenue", label: "Revenus GNF" }],
    points,
  };
}

async function buildLiveExecutiveSnapshot(args: {
  tenantIds: string[] | null;
  scopeHash: string;
  viewerUserId: string;
}): Promise<ExecutiveGlobalSnapshot> {
  const supabase = getSupabaseServerClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekStart = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();

  const [
    salesMonth,
    expensesMonth,
    clientsCount,
    productsCount,
    rhContractsActive,
    rhRecruitmentOpen,
    crmLeadsOpen,
    crmOppOpen,
    whCount,
    inventoryRows,
    poOpen,
    suppliersActive,
    incidentOpen,
    jobsPending,
    jobsFailed,
    tenantActive,
    tenantSnapshots,
    approvalsPending,
    formationProfiles,
    opsOverview,
    revenueChart,
  ] = await Promise.all([
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
    supabase
      .from("approval_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("department_key", "FORMATION")
      .is("deleted_at", null),
    getOperationsOperationalOverview(supabase),
    buildRevenueTrendChart(supabase),
  ]);

  const revenue = (salesMonth.data ?? []).reduce((sum, x) => sum + toCurrency(x.total_amount_gnf), 0);
  const expenses = (expensesMonth.data ?? []).reduce((sum, x) => sum + toCurrency(x.amount_gnf), 0);
  const margin = revenue - expenses;
  const inventoryTotal = (inventoryRows.data ?? []).reduce((sum, x) => sum + toCount(x.qty_on_hand), 0);
  const correlationId = createExecutiveCorrelationId();

  const finance: DeptKpiPayload = {
    stats: [
      { id: "revenue", label: "dashboard.dept.kpi.totalRevenueMonth", value: revenue, unit: "currency" },
      { id: "expenses", label: "dashboard.dept.kpi.totalExpensesMonth", value: expenses, unit: "currency" },
      { id: "margin", label: "dashboard.dept.kpi.netMargin", value: revenue - expenses, unit: "currency" },
      { id: "transactions", label: "dashboard.dept.kpi.transactions", value: toCount(salesMonth.count) + toCount(expensesMonth.count), unit: "count" },
    ],
    charts: [revenueChart],
    alerts:
      margin < 0
        ? [{ id: "margin_negative", level: "warning" as const, message: "executive.alert.marginNegative" }]
        : [],
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
      {
        id: "approvalsPending",
        label: "executive.kpi.approvalsPending",
        value: toCount(approvalsPending.count),
        unit: "count",
      },
    ],
    charts: [],
    alerts:
      toCount(approvalsPending.count) > 5
        ? [{ id: "approval_backlog", level: "warning", message: "executive.alert.approvalBacklog" }]
        : [],
    activity: [],
    health: { status: "ok" },
    metadata: { source: "logistics_sql_aggregates", generatedAt: isoNow(), placeholder: false },
  };

  const consultation: DeptKpiPayload = {
    stats: [
      { id: "openTasks", label: "dashboard.dept.kpi.openTasks", value: opsOverview.openTasks, unit: "count" },
      { id: "activeProjects", label: "dashboard.dept.kpi.activeProjects", value: opsOverview.activeProjects, unit: "count" },
      { id: "deliveryRate", label: "dashboard.dept.kpi.deliveryRate", value: opsOverview.completionRatePct, unit: "percent" },
      { id: "delayedDeliveries", label: "executive.kpi.delayedDeliveries", value: opsOverview.delayedDeliveries, unit: "count" },
    ],
    charts: [],
    alerts:
      opsOverview.delayedDeliveries > 0
        ? [{ id: "ops_delay", level: "warning", message: "executive.alert.deliveryDelayed" }]
        : [],
    activity: [],
    health: { status: "ok" },
    metadata: { source: "operations_sql_aggregates", generatedAt: isoNow(), placeholder: false },
  };

  const marketing: DeptKpiPayload = {
    stats: [
      { id: "openLeads", label: "crm.dashboard.kpi.leads", value: toCount(crmLeadsOpen.count), unit: "count" },
      { id: "openOpportunities", label: "crm.dashboard.kpi.opportunities", value: toCount(crmOppOpen.count), unit: "count" },
      { id: "pipelineRevenue", label: "executive.kpi.pipelineValue", value: revenue, unit: "currency" },
    ],
    charts: [],
    alerts: [],
    activity: [],
    health: { status: "ok" },
    metadata: { source: "crm_marketing_proxy", generatedAt: isoNow(), placeholder: false },
  };

  const formation: DeptKpiPayload = {
    stats: [
      {
        id: "formationStaff",
        label: "executive.kpi.formationStaff",
        value: toCount(formationProfiles.count),
        unit: "count",
      },
      { id: "activeContracts", label: "rh.dashboard.kpi.activeContracts", value: toCount(rhContractsActive.count), unit: "count" },
    ],
    charts: [],
    alerts: [],
    activity: [],
    health: { status: formationProfiles.count ? "ok" : "degraded" },
    metadata: { source: "formation_profiles_proxy", generatedAt: isoNow(), placeholder: false },
  };

  const domains: ExecutiveGlobalSnapshot["domains"] = {
    vente,
    finance,
    rh,
    logistique,
    formation,
    consultation,
    marketing,
  };

  const liveDomainCount = 7;

  const snapshot: ExecutiveGlobalSnapshot = {
    id: "executive_global_v1",
    domains,
    meta: {
      engineVersion: "1.2.0",
      correlationId,
      generatedAtIso: isoNow(),
    },
    executiveMeta: {
      correlationId,
      domainsLoaded: liveDomainCount,
      domainsFailed: 0,
    },
  };

  void emitExecutiveSnapshotRefreshed({
    actorUserId: args.viewerUserId,
    snapshotId: snapshot.id,
    domainsLoaded: liveDomainCount,
  }).catch((e) => console.warn("[executive-snapshot]", e));

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
    return buildLiveExecutiveSnapshot({ ...scope, viewerUserId });
  },
);
