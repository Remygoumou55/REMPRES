"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { refreshCrmVisualDashboardAction } from "@/modules/department-dashboards/crm/server/actions";

export function useCrmVisualRefresh() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await refreshCrmVisualDashboardAction();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [...queryKeys.departmentDashboards.crmVisual] });
      await qc.invalidateQueries({ queryKey: [...queryKeys.dept.kpis("vente")] });
    },
  });
}
