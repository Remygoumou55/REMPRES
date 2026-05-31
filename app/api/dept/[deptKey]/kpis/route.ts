import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions, getProfileAuthBrief } from "@/lib/server/permissions";
import { assertApiDeptKpiAccess } from "@/lib/server/api-route-guard";
import { hasSystemRootAuthority } from "@/lib/auth/system-authority";
import { DEPARTMENTS, type DepartmentKey } from "@/lib/constants/departments";
import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";
import { buildDeptFinanceKpiPayload } from "@/lib/finance/runtime/finance-kpi-runtime";
import { buildDeptLogistiqueKpiPayload } from "@/lib/logistics/runtime/logistics-kpi-runtime";
import { buildDeptConsultationKpiPayload } from "@/lib/operations/runtime/operations-kpi-runtime";
import { buildDeptVenteKpiPayload } from "@/lib/vente/runtime/vente-kpi-runtime";
import { buildDeptFormationKpiPayload } from "@/lib/formation/runtime/formation-kpi-runtime";
import { buildDeptMarketingKpiPayload } from "@/lib/marketing/runtime/marketing-kpi-runtime";
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

  const profileBrief = await getProfileAuthBrief(user.id);
  const superAdmin = hasSystemRootAuthority({
    roleKey: profileBrief.roleKey,
    systemAuthority: profileBrief.systemAuthority,
  });

  const [deptPermission, access] = await Promise.all([
    getModulePermissions(user.id, [deptKey]),
    assertApiDeptKpiAccess(user.id, deptKey, profileBrief),
  ]);

  if (!access.ok) {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const supabase = getSupabaseServerClient();
  const now = new Date();

  const activitiesPromise = getRecentActivity(supabase, {
    moduleKeys: getDeptActivityModuleKeys(deptKey as DepartmentKey),
    excludeModules: ["audit"],
    excludeActions: ["read"],
    limit: 4,
  });

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
      data = await buildDeptFormationKpiPayload(now);
      break;
    }

    case "consultation": {
      data = await buildDeptConsultationKpiPayload(supabase, user.id, now);
      break;
    }

    case "marketing": {
      data = await buildDeptMarketingKpiPayload(now);
      break;
    }

    case "logistique": {
      data = await buildDeptLogistiqueKpiPayload(supabase, user.id, now);
      break;
    }

    default:
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  const activities = await activitiesPromise;

  return NextResponse.json({
    dept: deptKey,
    data,
    activities,
    lastUpdated: new Date().toISOString(),
  });
}

