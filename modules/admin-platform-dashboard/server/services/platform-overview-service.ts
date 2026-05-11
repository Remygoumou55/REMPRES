import { buildAdminPlatformOverviewModel } from "../../core/platform-overview";
import type { AdminPlatformOverviewModel } from "../../types/domain";

export function getAdminPlatformOverviewModel(): AdminPlatformOverviewModel {
  return buildAdminPlatformOverviewModel();
}
