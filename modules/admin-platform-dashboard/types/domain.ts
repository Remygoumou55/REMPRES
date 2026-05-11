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

export type AdminPlatformOverviewModel = {
  correlationId: string;
  generatedAtIso: string;
  links: readonly AdminPlatformCommandLink[];
};
