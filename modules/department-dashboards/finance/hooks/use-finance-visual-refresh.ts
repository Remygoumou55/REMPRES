"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { refreshFinanceVisualDashboardAction } from "@/modules/department-dashboards/finance/server/actions";

export function useFinanceVisualRefresh() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await refreshFinanceVisualDashboardAction();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [...queryKeys.departmentDashboards.financeVisual] });
      await qc.invalidateQueries({ queryKey: [...queryKeys.dept.kpis("finance")] });
    },
  });
}
