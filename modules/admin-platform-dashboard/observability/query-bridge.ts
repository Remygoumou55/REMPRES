import { queryKeys } from "@/lib/query/query-keys";

export const ADMIN_PLATFORM_OBSERVABILITY_QUERY = {
  hub: queryKeys.observability.hub,
  health: queryKeys.observability.health,
  incidents: queryKeys.observability.incidents,
} as const;
