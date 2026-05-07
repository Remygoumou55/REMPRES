import { DEPARTMENT_NAVIGATION, type DepartmentKey } from "@/lib/departments/department-config";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getDashboardKpis } from "@/lib/server/dashboard-kpis";
import { summarizeDepartmentActivity } from "@/lib/governance/analytics/activity-summary";

export type DepartmentKpi = {
  departmentKey: DepartmentKey;
  departmentLabel: string;
  usersCount: number;
  managersCount: number;
  activityCount7d: number;
  health: "healthy" | "watch" | "critical";
};

export type GovernanceSystemHealth = {
  realtime: "stable" | "degraded";
  sync: "stable" | "degraded";
  middleware: "stable" | "degraded";
  invitation: "stable" | "degraded";
};

export type GlobalGovernanceKpi = {
  enterprise: {
    clientsTotal: number;
    salesToday: number;
    salesMonth: number;
    netSaleAmountMonth: number;
    activityEvents24h: number;
    activeUsers: number;
  };
  departments: DepartmentKpi[];
  systemHealth: GovernanceSystemHealth;
  recentActivity: Awaited<ReturnType<typeof getDashboardKpis>>["recentActivity"];
};

function computeDepartmentHealth(activityCount7d: number): DepartmentKpi["health"] {
  if (activityCount7d >= 20) return "healthy";
  if (activityCount7d >= 5) return "watch";
  return "critical";
}

export async function aggregateGlobalGovernanceKpi(): Promise<GlobalGovernanceKpi> {
  const supabase = getSupabaseServerClient();
  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [dashboardKpis, activity24hRes, profilesRes, activity7dRes] = await Promise.all([
    getDashboardKpis(),
    supabase
      .from("activity_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since24h),
    supabase
      .from("profiles")
      .select("department_key,role_key")
      .is("deleted_at", null),
    supabase
      .from("activity_logs")
      .select("module_key,created_at")
      .gte("created_at", since7d)
      .limit(1500),
  ]);

  const supervisedDepartments = Object.entries(DEPARTMENT_NAVIGATION)
    .filter(([, nav]) => !nav.supervisionOnly && nav.routePrefixes.length > 0)
    .map(([k]) => k as DepartmentKey);

  const userRows = profilesRes.data ?? [];
  const usersByDept = Object.fromEntries(supervisedDepartments.map((k) => [k, 0])) as Record<
    DepartmentKey,
    number
  >;
  const managersByDept = Object.fromEntries(supervisedDepartments.map((k) => [k, 0])) as Record<
    DepartmentKey,
    number
  >;
  for (const row of userRows) {
    const departmentKey = String(row.department_key ?? "").trim().toUpperCase() as DepartmentKey;
    if (!(departmentKey in usersByDept)) continue;
    usersByDept[departmentKey] += 1;
    if (String(row.role_key ?? "").trim().toLowerCase() === "manager") {
      managersByDept[departmentKey] += 1;
    }
  }

  const activityRows = (activity7dRes.data ?? []).map((r) => ({
    module_key: String(r.module_key ?? ""),
    created_at: String(r.created_at ?? ""),
  }));
  const activityByDept = summarizeDepartmentActivity(activityRows, supervisedDepartments);

  const departments: DepartmentKpi[] = supervisedDepartments.map((departmentKey) => {
    const activityCount7d = activityByDept[departmentKey] ?? 0;
    return {
      departmentKey,
      departmentLabel: DEPARTMENT_NAVIGATION[departmentKey].label,
      usersCount: usersByDept[departmentKey] ?? 0,
      managersCount: managersByDept[departmentKey] ?? 0,
      activityCount7d,
      health: computeDepartmentHealth(activityCount7d),
    };
  });

  const systemHealth: GovernanceSystemHealth = {
    realtime: "stable",
    sync: activity24hRes.count !== null ? "stable" : "degraded",
    middleware: "stable",
    invitation: "stable",
  };

  return {
    enterprise: {
      clientsTotal: dashboardKpis.clientsTotal,
      salesToday: dashboardKpis.salesToday,
      salesMonth: dashboardKpis.salesCountMonth,
      netSaleAmountMonth: dashboardKpis.netSaleAmountMonth,
      activityEvents24h: activity24hRes.count ?? 0,
      activeUsers: userRows.length,
    },
    departments,
    systemHealth,
    recentActivity: dashboardKpis.recentActivity,
  };
}
