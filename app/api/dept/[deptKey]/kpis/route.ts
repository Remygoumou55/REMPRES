import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions, getProfileAuthBrief, isAdminRole, isSuperAdmin } from "@/lib/server/permissions";
import { DEPARTMENTS, type DepartmentKey } from "@/lib/constants/departments";
import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";
import { buildDeptFinanceKpiPayload } from "@/lib/finance/runtime/finance-kpi-runtime";
import { buildDeptVenteKpiPayload } from "@/lib/vente/runtime/vente-kpi-runtime";
import { resolveRhDeptKpisCached } from "@/modules/analytics/cache/rh-dept-kpis-resolver";

type RouteContext = { params: { deptKey: string } };

const VALID_KEYS = new Set(DEPARTMENTS.map((d) => d.key));

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deptKey = String(params.deptKey ?? "").trim().toLowerCase();
  if (!VALID_KEYS.has(deptKey as DepartmentKey)) {
    return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  const [superAdmin, adminRole, profileBrief, deptPermission] = await Promise.all([
    isSuperAdmin(user.id),
    isAdminRole(user.id),
    getProfileAuthBrief(user.id),
    getModulePermissions(user.id, [deptKey]),
  ]);

  const legacyDG = String(profileBrief.roleKey ?? "").trim().toLowerCase() === "directeur_general";
  if (!superAdmin && !adminRole && !legacyDG && !deptPermission.canRead) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseServerClient();
  const now = new Date();

  let data: DeptKpiPayload = {
    stats: [],
    charts: [],
    alerts: [],
    activity: [],
    health: { status: "ok" },
    metadata: { source: "dept-kpi-api", generatedAt: now.toISOString() },
  };

  switch (deptKey) {
    case "vente": {
      data = await buildDeptVenteKpiPayload(supabase, now);
      break;
    }

    case "finance": {
      data = await buildDeptFinanceKpiPayload(supabase, user.id, now);
      break;
    }

    case "rh": {
      const rhDeptUpper = String(profileBrief.departmentKey ?? "").trim().toUpperCase();
      const elevated =
        superAdmin ||
        adminRole ||
        legacyDG ||
        (deptPermission.canRead && rhDeptUpper === "RH");
      data = await resolveRhDeptKpisCached({
        viewerUserId: user.id,
        elevated,
      });
      break;
    }

    case "formation": {
      data = {
        stats: [
          { id: "activeTrainings", label: "dashboard.dept.kpi.activeTrainings", value: 0, unit: "count" },
          { id: "totalTrainees", label: "dashboard.dept.kpi.totalTrainees", value: 0, unit: "count" },
          { id: "certificatesIssued", label: "dashboard.dept.kpi.certificatesIssued", value: 0, unit: "count" },
          { id: "revenueThisMonth", label: "dashboard.dept.kpi.revenueThisMonth", value: 0, unit: "currency" },
        ],
        charts: [],
        alerts: [],
        activity: [],
        health: { status: "placeholder", notes: ["dashboard.dept.health.placeholder"] },
        metadata: { source: "formation", generatedAt: new Date().toISOString(), placeholder: true },
      };
      break;
    }

    case "consultation": {
      data = {
        stats: [
          { id: "activeMissions", label: "dashboard.dept.kpi.activeMissions", value: 0, unit: "count" },
          { id: "completedMissions", label: "dashboard.dept.kpi.completedMissions", value: 0, unit: "count" },
          { id: "totalClients", label: "dashboard.dept.kpi.totalClients", value: 0, unit: "count" },
          { id: "revenueThisMonth", label: "dashboard.dept.kpi.revenueThisMonth", value: 0, unit: "currency" },
        ],
        charts: [],
        alerts: [],
        activity: [],
        health: { status: "placeholder", notes: ["dashboard.dept.health.placeholder"] },
        metadata: { source: "consultation", generatedAt: new Date().toISOString(), placeholder: true },
      };
      break;
    }

    case "marketing": {
      data = {
        stats: [],
        charts: [],
        alerts: [{ id: "placeholder", level: "info", message: "dashboard.dept.health.placeholder" }],
        activity: [],
        health: { status: "placeholder", notes: ["dashboard.dept.health.placeholder"] },
        metadata: { source: "marketing", generatedAt: new Date().toISOString(), placeholder: true },
      };
      break;
    }

    case "logistique": {
      data = {
        stats: [
          { id: "totalItems", label: "dashboard.dept.kpi.totalItems", value: 0, unit: "count" },
          { id: "lowStockItems", label: "dashboard.dept.kpi.lowStockItems", value: 0, unit: "count" },
          { id: "pendingOrders", label: "dashboard.dept.kpi.pendingOrders", value: 0, unit: "count" },
        ],
        charts: [],
        alerts: [],
        activity: [],
        health: { status: "placeholder", notes: ["dashboard.dept.health.placeholder"] },
        metadata: { source: "logistique", generatedAt: new Date().toISOString(), placeholder: true },
      };
      break;
    }

    default:
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  return NextResponse.json({
    dept: deptKey,
    data,
    lastUpdated: new Date().toISOString(),
  });
}

