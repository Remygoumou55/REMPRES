/**
 * Routes cockpit département unifiées — DeptHomePage sur /dept/[slug].
 */
import { resolveAuthorityDepartmentKey } from "@/lib/auth/profile-authority";
import {
  DEPARTMENT_KEYS,
  normalizeDepartmentKey,
  type DepartmentKey,
} from "@/lib/departments/department-config";
import type { DepartmentKey as DeptSlug } from "@/lib/constants/departments";

const CANONICAL_TO_DEPT_SLUG: Partial<Record<DepartmentKey, DeptSlug>> = {
  [DEPARTMENT_KEYS.VENTE]: "vente",
  [DEPARTMENT_KEYS.FINANCE]: "finance",
  [DEPARTMENT_KEYS.RH]: "rh",
  [DEPARTMENT_KEYS.FORMATION]: "formation",
  [DEPARTMENT_KEYS.CONSULTATION]: "formation",
  [DEPARTMENT_KEYS.MARKETING]: "marketing",
  [DEPARTMENT_KEYS.LOGISTIQUE]: "logistique",
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
  systemAuthority?: string | null,
): string | null {
  return resolveDeptCockpitPath(
    resolveAuthorityDepartmentKey(roleKey, departmentKey, systemAuthority),
  );
}

export function isDeptCockpitPath(pathname: string): boolean {
  const path = normalizeDeptPathname(pathname);
  return path === "/dept" || path.startsWith("/dept/");
}

export function extractDeptSlugFromPath(pathname: string): DeptSlug | null {
  const path = normalizeDeptPathname(pathname);
  if (!path.startsWith("/dept/")) return null;
  const slug = path.slice("/dept/".length).split("/")[0] ?? "";
  if (slug === "consultation") return "formation";
  if (slug in CANONICAL_TO_DEPT_SLUG) return slug as DeptSlug;
  return null;
}

/** Cockpit unique Formation — /dept/consultation redirige côté page. */
export function isLegacyConsultationDeptSlug(slug: string): boolean {
  return slug === "consultation";
}

/**
 * Autorise /dept/[slug] — lock strict : uniquement le cockpit du département effectif.
 * Legacy DEPT_ALLOWED_ROUTES retiré (Étape 4 — pas de fuite cross-slug).
 */
export function canProfileAccessDeptPath(
  pathname: string,
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
  systemAuthority?: string | null,
): boolean {
  if (!isDeptCockpitPath(pathname)) return false;

  const path = normalizeDeptPathname(pathname);
  if (path === "/dept") return false;

  const profileCockpit = resolveDeptCockpitPathForProfile(
    roleKey,
    departmentKey,
    systemAuthority,
  );
  if (!profileCockpit) return false;

  if (path === profileCockpit || path.startsWith(`${profileCockpit}/`)) {
    return true;
  }

  const authority = resolveAuthorityDepartmentKey(roleKey, departmentKey, systemAuthority);
  if (
    authority === DEPARTMENT_KEYS.FORMATION &&
    (path === "/dept/consultation" || path.startsWith("/dept/consultation/"))
  ) {
    return true;
  }

  return false;
}
