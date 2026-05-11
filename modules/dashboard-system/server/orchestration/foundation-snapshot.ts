import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";
import type { DashboardDeptFetchResult } from "../../analytics";
import { mergeDashboardPayloads } from "../../core";
import type { DashboardErpDomainKey } from "../../types/domain";

export function buildFoundationSnapshotFromDeptFetches(
  foundationId: string,
  results: readonly DashboardDeptFetchResult[],
) {
  const domains: Partial<Record<DashboardErpDomainKey, DeptKpiPayload>> = {};
  for (const r of results) {
    if (!r.ok || !r.response) continue;
    const key = r.response.dept as DashboardErpDomainKey;
    domains[key] = r.response.data;
  }
  return mergeDashboardPayloads(foundationId, domains);
}
