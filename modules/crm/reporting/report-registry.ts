/** Registre reporting CRM — référence métier pour exports / snapshots batch. */
export const CRM_REPORT_DEFINITIONS = [
  { key: "crm_pipeline_weighted", label: "Pipeline pondéré", source: "view:v_crm_pipeline_weighted" },
  { key: "crm_forecast_snapshots", label: "Prévisions stockées", source: "table:crm_forecast_snapshots" },
] as const;
