/**
 * P8 — OBSERVABILITY_API_MAP (GET only).
 */

export const OBSERVABILITY_API_MAP_VERSION = "observability-api-map-p8-v1" as const;

export type ObservabilityApiEndpoint = {
  method: "GET";
  path: string;
  handler: string;
  scope: string;
  rateLimit: string;
  security: string;
  responseShape: string;
};

export const OBSERVABILITY_API_MAP: readonly ObservabilityApiEndpoint[] = [
  {
    method: "GET",
    path: "/api/erp/observability/snapshot",
    handler: "app/api/erp/observability/snapshot/route.ts",
    scope: "full snapshot",
    rateLimit: "standard_session — no-store",
    security: "assertErpObservabilityReadAccess",
    responseShape: "ErpObservabilitySnapshot",
  },
  {
    method: "GET",
    path: "/api/erp/observability/events",
    handler: "app/api/erp/observability/events/route.ts",
    scope: "recentEvents + failures subset",
    rateLimit: "standard_session",
    security: "assertErpObservabilityReadAccess + scope filter",
    responseShape: "{ events, failures }",
  },
  {
    method: "GET",
    path: "/api/erp/observability/handlers",
    handler: "app/api/erp/observability/handlers/route.ts",
    scope: "handler registry",
    rateLimit: "standard_session",
    security: "super_admin | observability | admin",
    responseShape: "{ handlers }",
  },
  {
    method: "GET",
    path: "/api/erp/observability/notifications",
    handler: "app/api/erp/observability/notifications/route.ts",
    scope: "notification bridge log",
    rateLimit: "standard_session",
    security: "scoped by event type",
    responseShape: "{ notifications }",
  },
  {
    method: "GET",
    path: "/api/erp/observability/automation",
    handler: "app/api/erp/observability/automation/route.ts",
    scope: "automation traces",
    rateLimit: "standard_session",
    security: "scoped by event type",
    responseShape: "{ automation }",
  },
] as const;

export const OBSERVABILITY_API_READINESS = {
  postForbidden: true,
  deleteForbidden: true,
  adminControlsForbidden: true,
  replayForbidden: true,
  allGetEndpointsDefined: OBSERVABILITY_API_MAP.length >= 5,
} as const;
