export * from "@/modules/analytics/constants/cache-tags";

export const ANALYTICS_ENGINE_VERSION = "1.0.0";

/** TTL conseillé digest snapshot DB (secondes) pour décision lecture matérialisée. */
export const RH_DEPT_KPIS_SNAPSHOT_MAX_AGE_SEC = 120;

/** Revalidation ISR-style pour unstable_cache (secondes). */
export const RH_DEPT_KPIS_NEXT_CACHE_SEC = 25;

export const RH_FOUNDATION_NEXT_CACHE_SEC = 20;
