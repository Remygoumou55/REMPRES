"use client";

import { useQuery } from "@tanstack/react-query";
import type { DeptKpiApiResponse } from "@/lib/dept/kpi-contract";
import { queryKeys } from "@/lib/query/query-keys";

export function useCrmVisualSnapshot() {
  return useQuery({
    queryKey: [...queryKeys.departmentDashboards.crmVisual],
    queryFn: async () => {
      const res = await fetch("/api/dept/vente/kpis", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load sales KPI: ${res.status}`);
      const data = (await res.json()) as DeptKpiApiResponse;
      return data.data;
    },
    staleTime: 45_000,
    refetchInterval: 120_000,
  });
}
