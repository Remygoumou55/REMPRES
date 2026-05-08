"use client";

import { useQuery } from "@tanstack/react-query";

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
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
  });
}

