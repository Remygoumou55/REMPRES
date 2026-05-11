"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { refreshDepartmentDashboardsAction } from "../server/actions/refresh-department-dashboards";

export function useDepartmentDashboardRefresh(deptKey: string) {
  const qc = useQueryClient();
  const key = String(deptKey ?? "").trim().toLowerCase();
  return useMutation({
    mutationFn: async () => {
      await refreshDepartmentDashboardsAction(key);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [...queryKeys.dept.kpis(key)] });
      await qc.invalidateQueries({ queryKey: [...queryKeys.departmentDashboards.dept(key)] });
    },
  });
}
