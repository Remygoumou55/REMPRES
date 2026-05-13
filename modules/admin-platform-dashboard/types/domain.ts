/** Surfaces de pilotage plateforme — cartographie logique vers les hubs admin existants. */
export type AdminPlatformSurfaceKey =
  | "observability"
  | "infrastructure"
  | "ai"
  | "cloud"
  | "governance"
  | "resilience"
  | "multitenant"
  | "platform"
  | "ecosystem"
  | "compliance";

export type AdminPlatformCommandLink = {
  surface: AdminPlatformSurfaceKey;
  href: string;
  labelKey: string;
  descriptionKey: string;
};

export type AdminPlatformMetric = {
  id: string;
  labelKey: string;
  value: number;
  unit?: "count" | "percent";
};

export type AdminPlatformOverviewModel = {
  correlationId: string;
  generatedAtIso: string;
  links: readonly AdminPlatformCommandLink[];
  metrics: readonly AdminPlatformMetric[];
  tenantScope: "global" | "scoped";
};
