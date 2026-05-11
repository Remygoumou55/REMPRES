import { ADMIN_PLATFORM_COMMAND_LINKS } from "../constants/command-links";
import type { AdminPlatformOverviewModel } from "../types/domain";
import { createAdminPlatformCorrelationId } from "../utils/correlation";

export function buildAdminPlatformOverviewModel(): AdminPlatformOverviewModel {
  return {
    correlationId: createAdminPlatformCorrelationId(),
    generatedAtIso: new Date().toISOString(),
    links: ADMIN_PLATFORM_COMMAND_LINKS,
  };
}
