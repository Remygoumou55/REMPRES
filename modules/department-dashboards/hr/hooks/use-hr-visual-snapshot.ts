"use client";

import { useQuery } from "@tanstack/react-query";
import type { DeptKpiApiResponse } from "@/lib/dept/kpi-contract";
import { queryKeys } from "@/lib/query/query-keys";
import { toHrVisualKpiSnapshot } from "@/modules/department-dashboards/hr/visual/kpi";

export function useHrVisualSnapshot() {
  return useQuery({
    queryKey: [...queryKeys.departmentDashboards.hrVisual],
    queryFn: async () => {
      const res = await fetch("/api/dept/rh/kpis", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load RH KPI: ${res.status}`);
      const data = (await res.json()) as DeptKpiApiResponse;
      return toHrVisualKpiSnapshot(data.data);
    },
    staleTime: 45_000,
    refetchInterval: 120_000,
  });
}
