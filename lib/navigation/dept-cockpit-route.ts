/**
 * Routes cockpit département unifiées — DeptHomePage sur /dept/[slug].
 */
import { DEPT_ALLOWED_ROUTES } from "@/lib/constants/role-routes";
import { resolveAuthorityDepartmentKey } from "@/lib/auth/profile-authority";
import {
  DEPARTMENT_KEYS,
  getDepartmentRoutePrefixes,
  normalizeDepartmentKey,
  type DepartmentKey,
} from "@/lib/departments/department-config";
import type { DepartmentKey as DeptSlug } from "@/lib/constants/departments";

const CANONICAL_TO_DEPT_SLUG: Partial<Record<DepartmentKey, DeptSlug>> = {
  [DEPARTMENT_KEYS.VENTE]: "vente",
  [DEPARTMENT_KEYS.FINANCE]: "finance",
  [DEPARTMENT_KEYS.RH]: "rh",
  [DEPARTMENT_KEYS.FORMATION]: "formation",
  [DEPARTMENT_KEYS.CONSULTATION]: "consultation",
  [DEPARTMENT_KEYS.MARKETING]: "marketing",
  [DEPARTMENT_KEYS.LOGISTIQUE]: "logistique",
};

const DEPT_SLUG_TO_ROUTE_PREFIX: Record<DeptSlug, string> = {
  vente: "/vente",
  finance: "/finance",
  rh: "/rh",
  formation: "/formation",
  consultation: "/consultation",
  marketing: "/marketing",
  logistique: "/logistique",
};

function normalizeDeptPathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  const base = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (base.length > 1 && base.endsWith("/")) return base.slice(0, -1);
  return base;
}

/** Chemin cockpit factorisé (/dept/vente, …) ou null si hors périmètre. */
export function resolveDeptCockpitPath(
  departmentKey: string | null | undefined,
): string | null {
  const k = normalizeDepartmentKey(departmentKey);
  if (!k) return null;
  const slug = CANONICAL_TO_DEPT_SLUG[k as DepartmentKey];
  return slug ? `/dept/${slug}` : null;
}

/** Cockpit département dérivé du profil (department_key ou rôle legacy gouverné). */
export function resolveDeptCockpitPathForProfile(
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): string | null {
  return resolveDeptCockpitPath(resolveAuthorityDepartmentKey(roleKey, departmentKey));
}

export function isDeptCockpitPath(pathname: string): boolean {
  const path = normalizeDeptPathname(pathname);
  return path === "/dept" || path.startsWith("/dept/");
}

export function extractDeptSlugFromPath(pathname: string): DeptSlug | null {
  const path = normalizeDeptPathname(pathname);
  if (!path.startsWith("/dept/")) return null;
  const slug = path.slice("/dept/".length).split("/")[0] ?? "";
  if (slug in DEPT_SLUG_TO_ROUTE_PREFIX) return slug as DeptSlug;
  return null;
}

/**
 * Autorise /dept/[slug] pour le département du profil (manager/agent/comptable legacy)
 * sans ouvrir les autres slugs.
 */
export function canProfileAccessDeptPath(
  pathname: string,
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): boolean {
  const path = normalizeDeptPathname(pathname);
  if (path === "/dept") return false;
  if (!path.startsWith("/dept/")) return false;

  const slug = extractDeptSlugFromPath(path);
  if (!slug) return false;

  const profileCockpit = resolveDeptCockpitPathForProfile(roleKey, departmentKey);
  if (profileCockpit && (path === profileCockpit || path.startsWith(`${profileCockpit}/`))) {
    return true;
  }

  const operationalPrefix = DEPT_SLUG_TO_ROUTE_PREFIX[slug];
  const prefixes = getDepartmentRoutePrefixes(departmentKey);
  if (operationalPrefix && prefixes.includes(operationalPrefix)) {
    return true;
  }

  const rawRole = String(roleKey ?? "").trim().toLowerCase();
  const legacyRoutes = DEPT_ALLOWED_ROUTES[rawRole];
  if (!legacyRoutes) return false;

  return legacyRoutes.some((allowedPrefix) => {
    if (allowedPrefix === "/dept") return path.startsWith("/dept/");
    return path === allowedPrefix || path.startsWith(`${allowedPrefix}/`);
  });
}
