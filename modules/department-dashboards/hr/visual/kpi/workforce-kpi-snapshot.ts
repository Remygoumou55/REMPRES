import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";
import type { HrVisualKpiSnapshot } from "@/modules/department-dashboards/hr/types";
import { createHrVisualCorrelationId } from "@/modules/department-dashboards/hr/utils";

export function toHrVisualKpiSnapshot(payload: DeptKpiPayload): HrVisualKpiSnapshot {
  return {
    source: "dept_rh_api",
    payload,
    correlationId: createHrVisualCorrelationId(),
    generatedAtIso: new Date().toISOString(),
  };
}
