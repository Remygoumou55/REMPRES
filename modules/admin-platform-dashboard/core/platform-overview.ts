import { ADMIN_PLATFORM_COMMAND_LINKS } from "../constants/command-links";
import type { AdminPlatformOverviewModel } from "../types/domain";
import { createAdminPlatformCorrelationId } from "../utils/correlation";

export function buildAdminPlatformOverviewModel(args?: {
  metrics?: AdminPlatformOverviewModel["metrics"];
  tenantScope?: AdminPlatformOverviewModel["tenantScope"];
}): AdminPlatformOverviewModel {
  return {
    correlationId: createAdminPlatformCorrelationId(),
    generatedAtIso: new Date().toISOString(),
    links: ADMIN_PLATFORM_COMMAND_LINKS,
    metrics: args?.metrics ?? [],
    tenantScope: args?.tenantScope ?? "global",
  };
}
