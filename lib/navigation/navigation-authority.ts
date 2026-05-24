/**
 * Navigation authority — Bloc 2 Étape 3 (unification).
 * UNE chaîne runtime : profile → sidebar-authority → AppShell.
 * SA : nav-config → ErpNavSidebar (gelé). super-admin-nav = dérivé validation uniquement.
 */
export const NAVIGATION_AUTHORITY_VERSION = "nav-cockpit-unification-v1" as const;

/** Source runtime Super Admin (ne pas dupliquer). */
export const SUPER_ADMIN_NAV_RUNTIME_SOURCE = "lib/constants/nav-config.ts" as const;

/** Source runtime départements métier. */
export const DEPARTMENT_NAV_RUNTIME_SOURCES = {
  spec: "lib/navigation/erp-ux-architecture.ts",
  builder: "lib/navigation/department-sidebar-nav.ts",
  resolver: "lib/navigation/sidebar-authority.ts",
  appComponent: "DepartmentBusinessSidebar",
} as const;

/** Dérivé de NAV_CONFIG — lockdown / tests SA uniquement, pas de rendu parallèle. */
export const SUPER_ADMIN_NAV_VALIDATION_SOURCE = "lib/navigation/super-admin-nav.ts" as const;

export {
  resolveSidebarAuthority,
  usesErpGlobalSidebarFromAuthority,
  SIDEBAR_AUTHORITY_VERSION,
  type SidebarAuthorityInput,
  type SidebarAuthorityResult,
  type SidebarRenderMode,
} from "@/lib/navigation/sidebar-authority";

export {
  getSidebarForRole,
  resolveSidebarRenderMode,
  usesErpGlobalSidebar,
} from "@/lib/navigation/sidebar-for-role";

export {
  SUPER_ADMIN_NAV_GROUPS,
  SUPER_ADMIN_OFFICIAL_RAIL_GROUP_IDS,
  getSuperAdminNavSegment,
  type SuperAdminNavGroupDef,
  type SuperAdminNavSegment,
} from "@/lib/navigation/super-admin-nav";

export {
  validateSuperAdminNavGroups,
  assertSuperAdminNavLockdown,
  SUPER_ADMIN_HOME_ROUTE,
} from "@/lib/navigation/super-admin-lockdown";

export { isAdminRouteKept, ADMIN_ROUTE_KEEP_PREFIXES } from "@/lib/navigation/admin-route-registry";
