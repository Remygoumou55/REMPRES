import { DEPARTMENT_NAVIGATION, type DepartmentKey } from "@/lib/departments/department-config";

/** Parse slug URL département (`/admin/departments/[departmentKey]`). */
export function parseDepartmentKeySlug(slug: string): DepartmentKey | null {
  const normalized = String(slug ?? "").trim().toUpperCase();
  if (!(normalized in DEPARTMENT_NAVIGATION)) return null;
  return normalized as DepartmentKey;
}
