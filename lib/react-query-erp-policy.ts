/**
 * Politique React Query ERP — alignée sur `makeQueryClient`.
 * Tout hook `useQuery` qui surcharge des options doit rester cohérent avec ces valeurs
 * (évite flicker au focus fenêtre et tempêtes de retry).
 */
export const ERP_QUERY_DEFAULT_STALE_MS = 1000 * 60 * 5;

export const ERP_QUERY_POLICY = {
  staleTime: ERP_QUERY_DEFAULT_STALE_MS,
  retry: 1,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
} as const;
