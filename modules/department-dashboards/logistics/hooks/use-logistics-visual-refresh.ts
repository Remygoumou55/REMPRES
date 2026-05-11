"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { refreshLogisticsVisualDashboardAction } from "@/modules/department-dashboards/logistics/server/actions";

export function useLogisticsVisualRefresh() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await refreshLogisticsVisualDashboardAction();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [...queryKeys.departmentDashboards.logisticsVisual] });
      await qc.invalidateQueries({ queryKey: [...queryKeys.dept.kpis("logistique")] });
    },
  });
}
