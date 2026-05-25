/**
 * Bloc 3 Étape 6 — Publishers Executive / BI / Observability Hub.
 */

import { publishIntegrationOfficialEvent } from "@/lib/erp-core/events/integrations/integration-publish";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

const EXECUTIVE_DEPT_KEY = "ADMINISTRATION" as const;

export async function emitExecutiveSnapshotRefreshed(params: {
  actorUserId: string;
  snapshotId: string;
  domainsLoaded: number;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.EXECUTIVE_SNAPSHOT_REFRESHED, {
    actorUserId: params.actorUserId,
    departmentKey: EXECUTIVE_DEPT_KEY,
    entityType: "executive_global_snapshot",
    entityId: params.snapshotId,
    correlationId: params.snapshotId,
    payload: { domains_loaded: params.domainsLoaded },
  });
}

export async function emitExecutiveKpiThresholdExceeded(params: {
  actorUserId: string;
  kpiKey: string;
  value: number;
  status: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.EXECUTIVE_KPI_THRESHOLD_EXCEEDED, {
    actorUserId: params.actorUserId,
    departmentKey: EXECUTIVE_DEPT_KEY,
    entityType: "erp_bi_kpi_definitions",
    entityId: params.kpiKey,
    correlationId: params.kpiKey,
    payload: { value: params.value, status: params.status },
  });
}

export async function emitExecutiveForecastGenerated(params: {
  actorUserId: string;
  forecastId: string;
  metricCount: number;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.EXECUTIVE_FORECAST_GENERATED, {
    actorUserId: params.actorUserId,
    departmentKey: EXECUTIVE_DEPT_KEY,
    entityType: "erp_executive_forecasts",
    entityId: params.forecastId,
    correlationId: params.forecastId,
    payload: { metric_count: params.metricCount },
  });
}

export async function emitExecutiveSignalRaised(params: {
  actorUserId: string;
  signalKey: string;
  severity: string;
  sourceDomain: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.EXECUTIVE_SIGNAL_RAISED, {
    actorUserId: params.actorUserId,
    departmentKey: EXECUTIVE_DEPT_KEY,
    entityType: "erp_executive_signals",
    entityId: params.signalKey,
    correlationId: params.signalKey,
    payload: { severity: params.severity, source_domain: params.sourceDomain },
  });
}

export async function emitAnalyticsSnapshotComputed(params: {
  actorUserId: string;
  scopeKey: string;
  kpiCount: number;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.ANALYTICS_SNAPSHOT_COMPUTED, {
    actorUserId: params.actorUserId,
    departmentKey: EXECUTIVE_DEPT_KEY,
    entityType: "erp_bi_kpi_snapshots",
    entityId: params.scopeKey,
    correlationId: params.scopeKey,
    payload: { kpi_count: params.kpiCount },
  });
}

export async function emitAnalyticsReportGenerated(params: {
  actorUserId: string;
  reportId: string;
  reportType: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.ANALYTICS_REPORT_GENERATED, {
    actorUserId: params.actorUserId,
    departmentKey: EXECUTIVE_DEPT_KEY,
    entityType: "executive_analytics_report",
    entityId: params.reportId,
    correlationId: params.reportId,
    payload: { report_type: params.reportType },
  });
}

export async function emitObservabilityHubRefreshed(params: {
  actorUserId: string;
  openIncidents: number;
  healthScore: number | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.OBSERVABILITY_HUB_REFRESHED, {
    actorUserId: params.actorUserId,
    departmentKey: EXECUTIVE_DEPT_KEY,
    entityType: "erp_observability_incidents",
    entityId: "observability_hub",
    correlationId: "observability_hub",
    payload: {
      open_incidents: params.openIncidents,
      health_score: params.healthScore,
    },
  });
}

export async function emitObservabilityHealthDegraded(params: {
  actorUserId: string;
  healthScore: number;
  previousScore: number | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.OBSERVABILITY_HEALTH_DEGRADED, {
    actorUserId: params.actorUserId,
    departmentKey: EXECUTIVE_DEPT_KEY,
    entityType: "erp_observability_health_snapshots",
    entityId: "global",
    correlationId: "global",
    payload: {
      health_score: params.healthScore,
      previous_score: params.previousScore,
    },
  });
}

export async function emitObservabilityIncidentEscalated(params: {
  actorUserId: string;
  incidentId: string;
  incidentKey: string;
  severity: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.OBSERVABILITY_INCIDENT_ESCALATED, {
    actorUserId: params.actorUserId,
    departmentKey: EXECUTIVE_DEPT_KEY,
    entityType: "erp_observability_incidents",
    entityId: params.incidentId,
    correlationId: params.incidentId,
    payload: { incident_key: params.incidentKey, severity: params.severity },
  });
}
