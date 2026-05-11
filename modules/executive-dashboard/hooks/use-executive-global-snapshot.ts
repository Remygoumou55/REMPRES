"use client";

import { useQuery } from "@tanstack/react-query";
import type { DepartmentKey } from "@/lib/constants/departments";
import { loadExecutiveGlobalSnapshotClient } from "../analytics/executive-client-orchestrator";
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
      const snap = await loadExecutiveGlobalSnapshotClient(deptKeys);
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
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? deptKeys.length > 0,
  });
}
