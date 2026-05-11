export { CRM_OPERATIONAL_LINKS } from "./operational-links";
export {
  buildCrmVisualFinalizationModel,
  type CrmVisualFinalizationModel,
  type CrmVisualHeatmapCell,
  SalesExecutiveHero,
  PipelineConversionCenter,
  CustomerChurnCenter,
  RevenueForecastPanel,
  AiSalesInsightsPanel,
  SalesActivityHeatmap,
  SalesMobileStrip,
  CrmVisualExportActions,
} from "./visual";
export { useCrmVisualSnapshot, useCrmVisualRefresh } from "./hooks";
export { assertCrmVisualRead, refreshCrmVisualDashboardAction } from "./server";
