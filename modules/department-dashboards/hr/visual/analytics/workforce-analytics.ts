import { fetchDeptKpiSnapshotsParallel } from "@/modules/department-dashboards/shared/analytics";
import { toHrVisualKpiSnapshot } from "@/modules/department-dashboards/hr/visual/kpi";

export async function loadHrVisualSnapshot() {
  const results = await fetchDeptKpiSnapshotsParallel(["rh"]);
  const rh = results.find((r) => r.dept === "rh");
  if (!rh?.ok || !rh.response) return null;
  return toHrVisualKpiSnapshot(rh.response.data);
}
