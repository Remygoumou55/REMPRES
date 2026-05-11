import type { DeptKpiApiResponse } from "@/lib/dept/kpi-contract";
import type { DepartmentKey } from "@/lib/constants/departments";
import { deptKpiApiPath } from "../kpi/kpi-registry";

export type DashboardDeptFetchResult = {
  dept: DepartmentKey;
  ok: boolean;
  response?: DeptKpiApiResponse;
  error?: string;
};

/** Agrégation parallèle côté client — réutilise les routes KPI existantes (pas de nouveau RPC). */
export async function fetchDeptKpiSnapshotsParallel(
  deptKeys: readonly DepartmentKey[],
  init?: RequestInit,
): Promise<DashboardDeptFetchResult[]> {
  const tasks = deptKeys.map(async (dept): Promise<DashboardDeptFetchResult> => {
    try {
      const res = await fetch(deptKpiApiPath(dept), {
        ...init,
        cache: "no-store",
      });
      if (!res.ok) {
        return { dept, ok: false, error: `HTTP ${res.status}` };
      }
      const response = (await res.json()) as DeptKpiApiResponse;
      return { dept, ok: true, response };
    } catch (e) {
      const message = e instanceof Error ? e.message : "fetch_failed";
      return { dept, ok: false, error: message };
    }
  });
  return Promise.all(tasks);
}
