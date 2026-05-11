"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { refreshHrVisualDashboardAction } from "@/modules/department-dashboards/hr/server/actions";

export function useHrVisualRefresh() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await refreshHrVisualDashboardAction();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [...queryKeys.departmentDashboards.hrVisual] });
      await qc.invalidateQueries({ queryKey: [...queryKeys.dept.kpis("rh")] });
    },
  });
}
