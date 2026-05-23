/**
 * P8 — OBSERVABILITY_COEXISTENCE_STRATEGY.
 */

export const OBSERVABILITY_COEXISTENCE_VERSION = "observability-coexistence-p8-v1" as const;

export type ObservabilityCoexistenceRow = {
  source: string;
  location: string;
  status: "legacy_parallel" | "unified_read" | "platform_separate";
  p8Treatment: string;
};

export const OBSERVABILITY_COEXISTENCE_TABLE: readonly ObservabilityCoexistenceRow[] = [
  {
    source: "event-traceability ring",
    location: "lib/erp-core/events/event-traceability.ts",
    status: "unified_read",
    p8Treatment: "Source SoT bus traces — pas de duplication",
  },
  {
    source: "notification-bridge-log",
    location: "handlers/notification-bridge-log.ts",
    status: "unified_read",
    p8Treatment: "Snapshot section notifications",
  },
  {
    source: "automation-trace-log",
    location: "automation/automation-trace-log.ts",
    status: "unified_read",
    p8Treatment: "Snapshot section automation",
  },
  {
    source: "modules/observability platform",
    location: "modules/observability/*",
    status: "platform_separate",
    p8Treatment: "Coexistence — pas merge ; /admin/observability inchangé",
  },
  {
    source: "governance_audit_events DB",
    location: "tryLogGovernanceAuditEvent on publish",
    status: "legacy_parallel",
    p8Treatment: "Audit persist optionnel publish — hors ring P8",
  },
  {
    source: "error-monitor / performance-monitor",
    location: "lib/monitoring/*",
    status: "platform_separate",
    p8Treatment: "Infra perf API — hors ERP bus UI P8",
  },
] as const;

export const OBSERVABILITY_COEXISTENCE_STRATEGY = {
  version: OBSERVABILITY_COEXISTENCE_VERSION,
  rule: "coexistence_first",
  unifiedEntryPoint: "getErpObservabilitySnapshot",
  forbidden: ["second parallel bus", "external broker", "websocket stream P8"],
  migrationOrder: ["snapshot runtime", "GET API", "UI read-only", "P11 replay optional"],
} as const;
