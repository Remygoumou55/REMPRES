"use client";

import { useQuery } from "@tanstack/react-query";
import type { DeptKpiApiResponse } from "@/lib/dept/kpi-contract";
import { queryKeys } from "@/lib/query/query-keys";

export function useLogisticsVisualSnapshot() {
  return useQuery({
    queryKey: [...queryKeys.departmentDashboards.logisticsVisual],
    queryFn: async () => {
      const res = await fetch("/api/dept/logistique/kpis", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load logistics KPI: ${res.status}`);
      const data = (await res.json()) as DeptKpiApiResponse;
      return data.data;
    },
    staleTime: 45_000,
    refetchInterval: 120_000,
  });
}
