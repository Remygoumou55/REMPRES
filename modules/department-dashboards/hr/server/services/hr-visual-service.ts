import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";
import { resolveRhDeptKpisCached } from "@/modules/analytics/cache/rh-dept-kpis-resolver";
import { toHrVisualKpiSnapshot } from "@/modules/department-dashboards/hr/visual/kpi";

export async function loadHrVisualSnapshotServer(opts: {
  viewerUserId: string;
  elevated: boolean;
}): Promise<{ payload: DeptKpiPayload; correlationId: string; generatedAtIso: string }> {
  const payload = await resolveRhDeptKpisCached(opts);
  const snap = toHrVisualKpiSnapshot(payload);
  return {
    payload: snap.payload,
    correlationId: snap.correlationId,
    generatedAtIso: snap.generatedAtIso,
  };
}
