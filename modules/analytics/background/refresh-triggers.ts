import { ANALYTICS_CACHE_TAGS } from "@/modules/analytics/constants/cache-tags";

/** Tags à invalider après mutations RH structurantes (aligné `revalidateRhScope`). */
export const ANALYTICS_REVALIDATE_TAGS_ON_RH_MUTATION = [
  ANALYTICS_CACHE_TAGS.rhDeptKpis,
  ANALYTICS_CACHE_TAGS.rhFoundation,
] as const;
