"use client";

import { useQuery } from "@tanstack/react-query";
import type { DeptKpiApiResponse } from "@/lib/dept/kpi-contract";
import { queryKeys } from "@/lib/query/query-keys";

export function useFinanceVisualSnapshot() {
  return useQuery({
    queryKey: [...queryKeys.departmentDashboards.financeVisual],
    queryFn: async () => {
      const res = await fetch("/api/dept/finance/kpis", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load finance KPI: ${res.status}`);
      const data = (await res.json()) as DeptKpiApiResponse;
      return data.data;
    },
    staleTime: 45_000,
    refetchInterval: 120_000,
  });
}
