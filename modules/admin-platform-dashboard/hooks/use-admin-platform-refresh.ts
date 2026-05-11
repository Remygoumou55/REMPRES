"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { refreshAdminPlatformDashboardAction } from "../server/actions/refresh-admin-platform-dashboard";

export function useAdminPlatformDashboardRefresh() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await refreshAdminPlatformDashboardAction();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [...queryKeys.adminPlatform.hub] });
    },
  });
}
