"use client";

import { useQuery } from "@tanstack/react-query";
import type { DepartmentKey } from "@/lib/constants/departments";
import { ERP_QUERY_POLICY } from "@/lib/react-query-erp-policy";
import { emitExecutiveTelemetry } from "../observability/telemetry";
import type { ExecutiveGlobalSnapshot } from "../types/domain";

export function useExecutiveGlobalSnapshot(
  deptKeys: readonly DepartmentKey[],
  queryKey: readonly unknown[],
  options?: { staleTime?: number; refetchInterval?: number; enabled?: boolean },
) {
  return useQuery<ExecutiveGlobalSnapshot>({
    queryKey: [...queryKey],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/executive/snapshot", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load executive snapshot: HTTP ${res.status}`);
      const snap = (await res.json()) as ExecutiveGlobalSnapshot;
      if (snap.executiveMeta.domainsFailed > 0) {
        emitExecutiveTelemetry({
          kind: "executive_snapshot_partial",
          correlationId: snap.executiveMeta.correlationId,
        });
      }
      return snap;
    },
    staleTime: options?.staleTime ?? 45_000,
    refetchInterval: options?.refetchInterval ?? 120_000,
    refetchOnWindowFocus: ERP_QUERY_POLICY.refetchOnWindowFocus,
    refetchOnReconnect: ERP_QUERY_POLICY.refetchOnReconnect,
    retry: ERP_QUERY_POLICY.retry,
    enabled: options?.enabled ?? deptKeys.length > 0,
  });
}
