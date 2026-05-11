import { DEPARTMENTS, type DepartmentKey } from "@/lib/constants/departments";

const VALID = new Set<string>(DEPARTMENTS.map((d) => d.key));

export function parseDepartmentDashboardKey(raw: string): DepartmentKey | null {
  const k = String(raw ?? "").trim().toLowerCase();
  if (!VALID.has(k)) return null;
  return k as DepartmentKey;
}
