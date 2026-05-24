/**
 * Routes cockpit département unifiées — DeptHomePage sur /dept/[slug].
 */
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
  [DEPARTMENT_KEYS.CONSULTATION]: "consultation",
  [DEPARTMENT_KEYS.MARKETING]: "marketing",
  [DEPARTMENT_KEYS.LOGISTIQUE]: "logistique",
};

/** Chemin cockpit factorisé (/dept/vente, …) ou null si hors périmètre. */
export function resolveDeptCockpitPath(
  departmentKey: string | null | undefined,
): string | null {
  const k = normalizeDepartmentKey(departmentKey);
  if (!k) return null;
  const slug = CANONICAL_TO_DEPT_SLUG[k as DepartmentKey];
  return slug ? `/dept/${slug}` : null;
}
