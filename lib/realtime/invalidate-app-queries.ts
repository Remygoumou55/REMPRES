import type { QueryClient } from "@tanstack/react-query";
import {
  APP_GLOBAL_QUERY_SCOPES,
  APP_REALTIME_TABLE_SCOPES,
  MODULE_QUERY_SCOPES,
} from "@/lib/realtime/app-tables";

export type AppSyncOptions = {
  /** Tables Supabase ayant changé (invalidation ciblée). */
  tables?: string[];
  /** Modules métier (clés `revalidation-map`, ex. `vente`, `rh`). */
  modules?: string[];
  /** Invalide tout le cache applicatif (rare — préférer modules/tables). */
  all?: boolean;
};

function uniqueScopes(scopes: readonly (readonly string[])[]): (readonly string[])[] {
  const seen = new Set<string>();
  const out: (readonly string[])[] = [];
  for (const scope of scopes) {
    const key = scope.join("\0");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(scope);
  }
  return out;
}

function scopesForTable(table: string): readonly (readonly string[])[] {
  return APP_REALTIME_TABLE_SCOPES[table] ?? [];
}

function scopesForModule(moduleKey: string): readonly (readonly string[])[] {
  return MODULE_QUERY_SCOPES[moduleKey] ?? [];
}

/**
 * Invalide le cache React Query après mutation ou événement realtime.
 * Complète `router.refresh()` pour les pages Server Components (KPIs, listes).
 */
export async function invalidateAppQueries(
  queryClient: QueryClient,
  options?: AppSyncOptions,
): Promise<void> {
  const collected: (readonly string[])[] = [...APP_GLOBAL_QUERY_SCOPES];

  if (options?.all) {
    for (const scopes of Object.values(APP_REALTIME_TABLE_SCOPES)) {
      collected.push(...scopes);
    }
    for (const scopes of Object.values(MODULE_QUERY_SCOPES)) {
      collected.push(...scopes);
    }
  } else {
    for (const table of options?.tables ?? []) {
      collected.push(...scopesForTable(table));
    }
    for (const mod of options?.modules ?? []) {
      collected.push(...scopesForModule(mod));
    }
  }

  const scopes = uniqueScopes(collected);
  await Promise.all(
    scopes.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey: [...queryKey] }),
    ),
  );
}
