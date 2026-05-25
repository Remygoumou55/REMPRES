/**
 * Executive / BI / Observability domain governance — Bloc 3 Étape 6.
 */
export const EXECUTIVE_DOMAIN_GOVERNANCE_VERSION = "executive-domain-governance-bloc3-v1" as const;

export const EXECUTIVE_DOMAIN_GOVERNANCE = {
  version: EXECUTIVE_DOMAIN_GOVERNANCE_VERSION,
  moduleKeys: ["executive", "bi"] as const,
  kpiRegistrySoT: "erp_bi_kpi_definitions",
  kpiHistorySoT: "erp_bi_kpi_snapshots",
  forecastSoT: "erp_executive_forecasts",
  signalsSoT: "erp_executive_signals",
  snapshotScopeKey: "executive_global_v1",
  eventOwner: "executive",
} as const;

export const EXECUTIVE_CAPABILITY_STATUS = {
  executiveCockpit: "active",
  biEngine: "active",
  kpiGovernance: "active",
  forecasting: "active",
  observabilityHub: "active",
  alerting: "active",
  crossDomainIntelligence: "active",
} as const;
