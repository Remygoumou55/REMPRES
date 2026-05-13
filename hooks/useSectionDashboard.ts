"use client";

import { useQuery } from "@tanstack/react-query";
import { ERP_QUERY_POLICY } from "@/lib/react-query-erp-policy";

export function useSectionDashboard<T>(
  apiRoute: string,
  queryKey: string[],
  options?: { staleTime?: number; refetchInterval?: number; enabled?: boolean },
) {
  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(apiRoute, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load dashboard section: ${response.status}`);
      }
      return (await response.json()) as T;
    },
    staleTime: options?.staleTime ?? 30_000,
    refetchInterval: options?.refetchInterval ?? 60_000,
    refetchOnWindowFocus: ERP_QUERY_POLICY.refetchOnWindowFocus,
    refetchOnReconnect: ERP_QUERY_POLICY.refetchOnReconnect,
    retry: ERP_QUERY_POLICY.retry,
    enabled: options?.enabled ?? true,
  });
}

