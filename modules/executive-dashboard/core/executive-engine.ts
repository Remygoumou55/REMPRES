import type { DashboardDeptFetchResult } from "@/modules/dashboard-system/analytics";
import { buildFoundationSnapshotFromDeptFetches } from "@/modules/dashboard-system/server/orchestration/foundation-snapshot";
import type { ExecutiveGlobalSnapshot } from "../types/domain";
import { createExecutiveCorrelationId } from "../utils/correlation";

const FOUNDATION_ID = "executive_global_v1";

export function buildExecutiveGlobalSnapshot(
  fetchResults: readonly DashboardDeptFetchResult[],
): ExecutiveGlobalSnapshot {
  const ok = fetchResults.filter((r) => r.ok && r.response);
  const failed = fetchResults.length - ok.length;
  const foundation = buildFoundationSnapshotFromDeptFetches(FOUNDATION_ID, fetchResults);
  const correlationId = foundation.meta.correlationId || createExecutiveCorrelationId();
  return {
    ...foundation,
    meta: { ...foundation.meta, correlationId },
    executiveMeta: {
      correlationId,
      domainsLoaded: ok.length,
      domainsFailed: failed,
    },
  };
}
