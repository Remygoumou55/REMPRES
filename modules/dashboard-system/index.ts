export { mergeDashboardPayloads } from "./core";
export { DashboardChartFromSpec, type DashboardChartFromSpecProps } from "./charts";
export { DashboardWidgetShell, type DashboardWidgetShellProps } from "./widgets";
export { DashboardGrid, type DashboardGridProps } from "./layouts";
export { DASHBOARD_FOUNDATION_DEPT_KEYS, deptKpiApiPath } from "./kpi";
export { fetchDeptKpiSnapshotsParallel, type DashboardDeptFetchResult } from "./analytics";
export { DASHBOARD_DATE_PRESET_OPTIONS } from "./filters";
export type { DashboardFilterBarProps, DatePresetOption } from "./filters";
export { DASHBOARD_REALTIME_BRIDGE } from "./realtime";
export { DASHBOARD_WIDGET_MARKETPLACE_CATALOG, type DashboardMarketplaceWidgetDescriptor } from "./marketplace";
export { createDeferredSurface } from "./performance";
export { emitDashboardTelemetry, type DashboardTelemetryEvent } from "./observability";
export type { DashboardAiInsight } from "./ai";
export type { DashboardExportRequest, DashboardExportSurface } from "./exports";
export type { DashboardCapabilityMatrix } from "./permissions";
export type {
  DashboardDateRangePreset,
  DashboardErpDomainKey,
  DashboardFoundationId,
  DashboardFoundationSnapshot,
  DashboardGlobalFilterState,
  DashboardLayoutBlueprint,
  DashboardSnapshotMeta,
  DashboardWidgetKind,
  DashboardWidgetPlacement,
} from "./types";
export {
  DASHBOARD_FOUNDATION_ENGINE_VERSION,
  DASHBOARD_FOUNDATION_CACHE_TAGS,
} from "./constants";
export { createDashboardCorrelationId } from "./utils";
export { useDashboardFoundationFilters } from "./hooks";
export { DashboardFoundationFilterBar } from "./components/filters";
export {
  refreshDashboardFoundationAction,
  assertDashboardDeptRead,
  parseDepartmentDashboardKey,
  buildFoundationSnapshotFromDeptFetches,
  DASHBOARD_FOUNDATION_JOB_TYPES,
} from "./server";
