export type { DepartmentDashboardVerticalId, DepartmentOperationalLink } from "./types";
export { DEPARTMENT_DASHBOARDS_ENGINE_VERSION, DEPARTMENT_DASHBOARDS_CACHE_TAGS } from "./constants";
export { createDepartmentDashboardCorrelationId } from "./utils";
export { getOperationalLinksForDepartment, ALL_DEPARTMENT_OPERATIONAL_LINKS } from "./core";
export { HR_OPERATIONAL_LINKS } from "./hr";
export { FINANCE_OPERATIONAL_LINKS } from "./finance";
export { CRM_OPERATIONAL_LINKS } from "./crm";
export { LOGISTICS_OPERATIONAL_LINKS } from "./logistics";
export { AI_OPERATIONAL_LINKS } from "./ai";
export { OBSERVABILITY_OPERATIONAL_LINKS } from "./observability";
export { TENANTS_OPERATIONAL_LINKS } from "./tenants";
export { CLOUD_OPERATIONAL_LINKS } from "./cloud";
export { GOVERNANCE_OPERATIONAL_LINKS } from "./governance";
export {
  departmentDeptKpiApiPath,
  departmentDashboardDeptKpiQueryKey,
} from "./shared/kpi";
export { DashboardChartFromSpec, type DashboardChartFromSpecProps } from "./shared/charts";
export { DashboardWidgetShell, type DashboardWidgetShellProps } from "./shared/widgets";
export { DashboardGrid, type DashboardGridProps } from "./shared/layouts";
export { DEPARTMENT_DASHBOARD_REALTIME_BRIDGE } from "./shared/realtime";
export { DASHBOARD_DATE_PRESET_OPTIONS } from "./shared/filters";
export type { DashboardFilterBarProps, DatePresetOption } from "./shared/filters";
export {
  fetchDeptKpiSnapshotsParallel,
  type DashboardDeptFetchResult,
} from "./shared/analytics";
export { createDeferredSurface } from "./shared/performance";
export { useDepartmentOperationalLinks, useDepartmentDashboardRefresh } from "./hooks";
export { DepartmentOperationsStrip } from "./components/DepartmentOperationsStrip";
export {
  assertDepartmentDashboardDeptRead,
  refreshDepartmentDashboardsAction,
  listOperationalLinksForDepartment,
  DEPARTMENT_DASHBOARD_JOB_TYPES,
  DEPARTMENT_DASHBOARD_REPOSITORY_PLACEHOLDER,
  DEPARTMENT_DASHBOARD_VALIDATOR_PLACEHOLDER,
} from "./server";
