/**
 * P8 — ERP_OBSERVABILITY_AUDIT (état POST-P7.3).
 */

export const ERP_OBSERVABILITY_AUDIT_VERSION = "erp-observability-audit-p8-v1" as const;

export type ObservabilityAuditFinding = {
  id: string;
  category: "visible" | "gap" | "debt" | "noise" | "limit";
  area: string;
  finding: string;
  location: string;
  p8Action: string;
};

export const ERP_OBSERVABILITY_AUDIT_FINDINGS: readonly ObservabilityAuditFinding[] = [
  {
    id: "O1",
    category: "visible",
    area: "event_bus",
    finding: "Traces publish/dispatch/handler via appendEventTrace",
    location: "lib/erp-core/events/event-traceability.ts",
    p8Action: "Unifier BUS_TRACE_MAP + read facade",
  },
  {
    id: "O2",
    category: "visible",
    area: "handlers",
    finding: "Registre handlers listable après bootstrap",
    location: "event-registry.ts + register-default-handlers.ts",
    p8Action: "Exposer dans snapshot",
  },
  {
    id: "O3",
    category: "visible",
    area: "notifications",
    finding: "Ring buffer projections bridge P2–P7.2",
    location: "handlers/notification-bridge-log.ts",
    p8Action: "Section notifications snapshot",
  },
  {
    id: "O4",
    category: "visible",
    area: "automation",
    finding: "Ring buffer traces P6/P7.3",
    location: "automation/automation-trace-log.ts",
    p8Action: "Section automation snapshot",
  },
  {
    id: "O5",
    category: "gap",
    area: "ui",
    finding: "Pas de vue ERP bus unifiée (admin observability = autre domaine)",
    location: "modules/observability vs erp-core/events",
    p8Action: "app/(app)/erp/observability read-only",
  },
  {
    id: "O6",
    category: "gap",
    area: "api",
    finding: "Pas d'API GET /api/erp/observability/*",
    location: "n/a",
    p8Action: "OBSERVABILITY_API_MAP + routes",
  },
  {
    id: "O7",
    category: "gap",
    area: "security",
    finding: "Traces non filtrées par rôle département",
    location: "event-traceability (raw)",
    p8Action: "OBSERVABILITY_SECURITY_MODEL filter",
  },
  {
    id: "O8",
    category: "limit",
    area: "retention",
    finding: "Ring buffers in-memory — perdu au restart",
    location: "all rings",
    p8Action: "Documenté — pas DB P8",
  },
  {
    id: "O9",
    category: "debt",
    area: "noise",
    finding: "Deux namespaces observability (platform vs ERP bus)",
    location: "modules/observability vs lib/erp-core/observability",
    p8Action: "Coexistence strategy — pas merge",
  },
  {
    id: "O10",
    category: "limit",
    area: "cross_domain",
    finding: "Pas de corrélation graphique entre events/notifications/automation",
    location: "n/a",
    p8Action: "P11+ — snapshot flat list P8",
  },
] as const;

export const ERP_OBSERVABILITY_AUDIT_SUMMARY = {
  auditVersion: ERP_OBSERVABILITY_AUDIT_VERSION,
  visibleAreas: 4,
  gapsBeforeP8: 3,
  rebuildForbidden: true,
  unifiedSnapshot: "getErpObservabilitySnapshot",
} as const;
