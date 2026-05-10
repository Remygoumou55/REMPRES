/** Types `erp_infrastructure_jobs.job_type` — dispatch worker interne. */
export const INFRA_JOB_TYPES = {
  ecosystemFederationDigest: "ecosystem.federation_digest",
  platformRegistryDigest: "platform.registry_digest",
  multitenantOrchestrationSweep: "multitenant.orchestration_sweep",
  cloudOperationsDigest: "cloud.operations_digest",
  governancePlatformMaturityDigest: "governance_platform.maturity_digest",
  resilienceReliabilityDigest: "resilience.reliability_digest",
  aiInsightPipeline: "ai.insight_pipeline",
  observabilityHealthDigest: "observability.health_digest",
  complianceRiskScan: "compliance.risk_scan",
  analyticsRhDigestRefresh: "analytics.rh_digest_refresh",
  exportGeneric: "export.generic",
  noopHealthCheck: "noop.health_check",
} as const;
