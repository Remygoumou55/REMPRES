import { DEPARTMENTS, type DepartmentKey } from "@/lib/constants/departments";

/** Pont vers les routes KPI départementales existantes (`/api/dept/[deptKey]/kpis`). */
export function deptKpiApiPath(deptKey: string): string {
  const key = String(deptKey ?? "").trim().toLowerCase();
  return `/api/dept/${key}/kpis`;
}

/** Clés départements alignées sur `DEPARTMENTS` (source unique). */
export const DASHBOARD_FOUNDATION_DEPT_KEYS: readonly DepartmentKey[] = DEPARTMENTS.map((d) => d.key);
