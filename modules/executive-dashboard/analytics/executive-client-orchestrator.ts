import { fetchDeptKpiSnapshotsParallel } from "@/modules/dashboard-system/analytics";
import type { DepartmentKey } from "@/lib/constants/departments";
import { buildExecutiveGlobalSnapshot } from "../core/executive-engine";

export async function loadExecutiveGlobalSnapshotClient(deptKeys: readonly DepartmentKey[]) {
  const results = await fetchDeptKpiSnapshotsParallel(deptKeys);
  return buildExecutiveGlobalSnapshot(results);
}
