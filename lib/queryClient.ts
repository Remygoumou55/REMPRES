import { QueryClient } from "@tanstack/react-query";
import { ERP_QUERY_POLICY } from "@/lib/react-query-erp-policy";

/**
 * Client React Query unique — politique « data ERP » (voir `ERP_QUERY_POLICY`).
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: ERP_QUERY_POLICY.staleTime,
        retry: ERP_QUERY_POLICY.retry,
        refetchOnWindowFocus: ERP_QUERY_POLICY.refetchOnWindowFocus,
        refetchOnReconnect: ERP_QUERY_POLICY.refetchOnReconnect,
      },
    },
  });
}
