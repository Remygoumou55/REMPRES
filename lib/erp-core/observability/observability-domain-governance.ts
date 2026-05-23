/**
 * P8 — OBSERVABILITY_GOVERNANCE_MODEL (catalogue gouverné ERP bus).
 */

export const OBSERVABILITY_DOMAIN_GOVERNANCE_VERSION = "observability-domain-governance-p8-v1" as const;

export type ObservabilityCapabilityStatus = "active" | "planned" | "restricted" | "blocked";

export type ObservabilityCapability = {
  id: string;
  label: string;
  status: ObservabilityCapabilityStatus;
  owner: string;
  retention: string;
  privacy: "internal" | "restricted";
  visibility: string;
  sourceOfTruth: string;
  notes: string;
};

/** OBSERVABILITY_GOVERNANCE_MODEL */
export const OBSERVABILITY_DOMAIN_GOVERNANCE = {
  version: OBSERVABILITY_DOMAIN_GOVERNANCE_VERSION,
  namespace: "lib/erp-core/observability",
  scope: "erp_bus_in_process",
  externalBrokerForbidden: true,
  writeOperationsForbidden: true,
  retentionPolicy: "ring_buffer_in_memory",
  maxRetention: {
    eventTraces: 500,
    notificationLogs: 200,
    automationTraces: 200,
  },
} as const;

export const OBSERVABILITY_GOVERNANCE_MAP: readonly ObservabilityCapability[] = [
  {
    id: "bus_event_traces",
    label: "Traces lifecycle bus",
    status: "active",
    owner: "lib/erp-core/events/event-traceability",
    retention: "ring 500",
    privacy: "restricted",
    visibility: "scoped_by_role",
    sourceOfTruth: "appendEventTrace",
    notes: "published / dispatched / handler_ok / handler_error",
  },
  {
    id: "handler_registry",
    label: "Registre handlers in-process",
    status: "active",
    owner: "lib/erp-core/events/event-registry",
    retention: "runtime session",
    privacy: "internal",
    visibility: "super_admin + observability module",
    sourceOfTruth: "listErpEventHandlers",
    notes: "Read-only — pas de unregister UI",
  },
  {
    id: "notification_bridge_log",
    label: "Projections notification bridge",
    status: "active",
    owner: "handlers/notification-bridge-log",
    retention: "ring 200",
    privacy: "restricted",
    visibility: "scoped_by_role",
    sourceOfTruth: "recordNotificationBridgeProjection",
    notes: "Coexistence — unifié dans snapshot P8",
  },
  {
    id: "automation_trace_log",
    label: "Traces automation engine",
    status: "active",
    owner: "automation/automation-trace-log",
    retention: "ring 200",
    privacy: "internal",
    visibility: "scoped_by_role",
    sourceOfTruth: "appendAutomationTrace",
    notes: "Read-safe rules only",
  },
  {
    id: "observability_snapshot",
    label: "Snapshot runtime unifié",
    status: "active",
    owner: "lib/erp-core/observability/runtime",
    retention: "point_in_time",
    privacy: "restricted",
    visibility: "API + UI read-only",
    sourceOfTruth: "getErpObservabilitySnapshot",
    notes: "Pas de persistence DB P8",
  },
  {
    id: "bus_replay",
    label: "Replay / kill switch bus",
    status: "planned",
    owner: "governance",
    retention: "n/a",
    privacy: "restricted",
    visibility: "none",
    sourceOfTruth: "n/a",
    notes: "P11+ si nécessaire — interdit P8",
  },
  {
    id: "external_telemetry",
    label: "Kafka / Grafana / APM",
    status: "blocked",
    owner: "governance",
    retention: "n/a",
    privacy: "restricted",
    visibility: "none",
    sourceOfTruth: "n/a",
    notes: "Hors scope ERP observability P8",
  },
] as const;
