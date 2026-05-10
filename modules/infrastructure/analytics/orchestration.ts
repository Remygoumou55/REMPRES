import { ANALYTICS_CACHE_TAGS } from "@/modules/analytics/constants/cache-tags";
import { INFRASTRUCTURE_CACHE_TAGS } from "@/modules/infrastructure/constants/cache-tags";

/** Tags combinés analytics + infra orchestration (digest Next cache cohérent). */
export const ERP_ORCHESTRATION_CACHE_TAGS = {
  ...ANALYTICS_CACHE_TAGS,
  ...INFRASTRUCTURE_CACHE_TAGS,
} as const;
