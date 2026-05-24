import type { DepartmentKey } from "@/lib/constants/departments";
import { assertApiDeptKpiAccess } from "@/lib/server/api-route-guard";

/**
 * Aligné sur `GET /api/dept/[deptKey]/kpis` — authority path unique (Étape 5).
 */
export async function assertDashboardDeptRead(userId: string, deptKey: DepartmentKey): Promise<void> {
  const access = await assertApiDeptKpiAccess(userId, deptKey);
  if (!access.ok) {
    throw new Error("Accès refusé au tableau de bord département.");
  }
}
