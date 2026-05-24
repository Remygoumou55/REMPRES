/**
 * Cockpit authority — Bloc 2 Étape 3 (ownership lock).
 * Un cockpit département = DeptHomePage sur /dept/[slug].
 * SA = SuperAdminCockpitClient sur /dashboard (gelé).
 */
import { resolveDeptCockpitPath, resolveDeptCockpitPathForProfile } from "@/lib/navigation/dept-cockpit-route";
import { SUPER_ADMIN_COCKPIT_ROUTE } from "@/lib/navigation/erp-ux-architecture";

export const COCKPIT_AUTHORITY_VERSION = "cockpit-unification-v1" as const;

export type CockpitSurfaceKind =
  | "super_admin_frozen"
  | "department_home"
  | "finance_operational"
  | "legacy_dashboard_redirect"
  | "unknown";

export type CockpitSurfaceDefinition = {
  kind: CockpitSurfaceKind;
  route: string;
  uiComponent: string;
  dataSource: string;
  frozen?: boolean;
};

/** Surfaces officielles — pas de shadow cockpit UI. */
export const COCKPIT_SURFACES: Record<CockpitSurfaceKind, CockpitSurfaceDefinition> = {
  super_admin_frozen: {
    kind: "super_admin_frozen",
    route: SUPER_ADMIN_COCKPIT_ROUTE,
    uiComponent: "SuperAdminCockpitClient",
    dataSource: "lib/server/super-admin-cockpit.ts",
    frozen: true,
  },
  department_home: {
    kind: "department_home",
    route: "/dept/[slug]",
    uiComponent: "DeptHomePage",
    dataSource: "lib/server/dept-dashboard.ts",
  },
  finance_operational: {
    kind: "finance_operational",
    route: "/finance",
    uiComponent: "FinanceDashboardClient",
    dataSource: "lib/server/finance-overview.ts",
  },
  legacy_dashboard_redirect: {
    kind: "legacy_dashboard_redirect",
    route: "/{dept}/dashboard",
    uiComponent: "(redirect)",
    dataSource: "dept-cockpit-route",
  },
  unknown: {
    kind: "unknown",
    route: "/",
    uiComponent: "—",
    dataSource: "—",
  },
};

/** Contrats B2/B3 — référence tests, pas UI runtime dept. */
export const COCKPIT_PAYLOAD_CONTRACTS = {
  vente: "lib/vente/runtime/vente-cockpit-payload.ts",
  finance: "lib/finance/runtime/finance-cockpit-payload.ts",
} as const;

const LEGACY_DASHBOARD_REDIRECT_PREFIXES = [
  "/vente/dashboard",
  "/finance/dashboard",
  "/rh/dashboard",
  "/logistique/dashboard",
  "/formation/dashboard",
  "/consultation/dashboard",
  "/marketing/dashboard",
] as const;

function normalize(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  const base = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (base.length > 1 && base.endsWith("/")) return base.slice(0, -1);
  return base;
}

export function resolveCockpitSurfaceKind(pathname: string): CockpitSurfaceKind {
  const path = normalize(pathname);
  if (path === SUPER_ADMIN_COCKPIT_ROUTE || path.startsWith(`${SUPER_ADMIN_COCKPIT_ROUTE}/`)) {
    return "super_admin_frozen";
  }
  if (path === "/dept" || path.startsWith("/dept/")) return "department_home";
  if (path === "/finance") return "finance_operational";
  if (path.startsWith("/finance/")) {
    if (LEGACY_DASHBOARD_REDIRECT_PREFIXES.some((p) => path === p)) {
      return "legacy_dashboard_redirect";
    }
    return "finance_operational";
  }
  for (const legacy of LEGACY_DASHBOARD_REDIRECT_PREFIXES) {
    if (path === legacy) return "legacy_dashboard_redirect";
  }
  if (path.includes("/dashboard") && !path.startsWith("/admin")) return "legacy_dashboard_redirect";
  return "unknown";
}

export function resolveCanonicalDeptCockpitPath(
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): string | null {
  return resolveDeptCockpitPathForProfile(roleKey, departmentKey);
}

export { resolveDeptCockpitPath, resolveDeptCockpitPathForProfile };
