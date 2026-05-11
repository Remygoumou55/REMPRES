import { queryKeys } from "@/lib/query/query-keys";
import { deptKpiApiPath } from "@/modules/dashboard-system/kpi";

export { deptKpiApiPath as departmentDeptKpiApiPath };

export function departmentDashboardDeptKpiQueryKey(deptKey: string) {
  return queryKeys.dept.kpis(deptKey);
}
