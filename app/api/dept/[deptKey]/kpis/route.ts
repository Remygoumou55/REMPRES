import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions, getProfileAuthBrief, isSuperAdmin } from "@/lib/server/permissions";
import { assertApiDeptKpiAccess } from "@/lib/server/api-route-guard";
import { DEPARTMENTS, type DepartmentKey } from "@/lib/constants/departments";
import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";
import { buildDeptFinanceKpiPayload } from "@/lib/finance/runtime/finance-kpi-runtime";
import { buildDeptLogistiqueKpiPayload } from "@/lib/logistics/runtime/logistics-kpi-runtime";
import { buildDeptVenteKpiPayload } from "@/lib/vente/runtime/vente-kpi-runtime";
import { getRecentActivity } from "@/lib/server/get-recent-activity";
import { getDeptActivityModuleKeys } from "@/lib/dept/dashboard-module-keys";
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

  const [profileBrief, deptPermission] = await Promise.all([
    getProfileAuthBrief(user.id),
    getModulePermissions(user.id, [deptKey]),
  ]);

  const access = await assertApiDeptKpiAccess(user.id, deptKey, profileBrief);
  if (!access.ok) {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const superAdmin = await isSuperAdmin(user.id);

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
      const rhDeptUpper = String(access.brief.authorityDepartmentKey ?? profileBrief.departmentKey ?? "")
        .trim()
        .toUpperCase();
      const elevated =
        superAdmin ||
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
      data = await buildDeptLogistiqueKpiPayload(supabase, user.id, now);
      break;
    }

    default:
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  const activities = await getRecentActivity(supabase, {
    moduleKeys: getDeptActivityModuleKeys(deptKey as DepartmentKey),
    excludeModules: ["audit"],
    excludeActions: ["read"],
    limit: 4,
  });

  return NextResponse.json({
    dept: deptKey,
    data,
    activities,
    lastUpdated: new Date().toISOString(),
  });
}

