import { queryKeys } from "@/lib/query/query-keys";

/** Raccord React Query vers le domaine infrastructure existant. */
export const ADMIN_PLATFORM_INFRASTRUCTURE_QUERY = {
  jobsRoot: queryKeys.infrastructure.jobs,
  jobBatch: (batchId: string) => queryKeys.infrastructure.jobBatch(batchId),
} as const;
