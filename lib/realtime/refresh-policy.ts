/**
 * Politique unique pour `router.refresh()` déclenché par les ponts Supabase Realtime.
 * Réduit le flicker (debounce) et limite la cadence serveur (min interval).
 */
export const ENTERPRISE_REALTIME_PAGE_REFRESH = {
  debounceMs: 400,
  minIntervalMs: 1400,
} as const;

/** Debounce côté client pour refetch JSON (ex. finance) après événement postgres. */
export const ENTERPRISE_REALTIME_CLIENT_REFETCH_DEBOUNCE_MS = 400;
