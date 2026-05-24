/**
 * Runtime performance registry — Bloc 2 Étape 4.
 * Baseline et contrats d'optimisation (mesure documentée, pas de rewrite).
 */
export const RUNTIME_PERFORMANCE_VERSION = "runtime-cleanup-v1" as const;

/** Shell i18n : 3 bundles vs 8 full page bundles. */
export const SHELL_I18N_BUNDLE_COUNT = 3 as const;

/** Layout server access — dedupliqué par requête via React cache(). */
export const LAYOUT_ACCESS_SOURCE = "lib/server/layout-access.ts" as const;

/** Provider stack unique (app/providers.tsx). */
export const PROVIDER_STACK = [
  "I18nProvider",
  "QueryClientProvider",
  "ToastProvider",
  "CurrencyContextProvider",
] as const;

export type RuntimePerfMetric = {
  id: string;
  before: string;
  after: string;
  result: "improved" | "neutral";
};

/** Métriques documentées Étape 4 (avant → après). */
export const RUNTIME_PERF_MATRIX: RuntimePerfMetric[] = [
  {
    id: "sidebar_mount_desktop",
    before: "2 instances (mobile drawer + desktop rail)",
    after: "1 instance desktop; mobile drawer mount on open",
    result: "improved",
  },
  {
    id: "shell_rail_default",
    before: "new object each AppShell render when shellRail undefined",
    after: "EMPTY_SHELL_RAIL stable reference",
    result: "improved",
  },
  {
    id: "sidebar_props",
    before: "new sidebarProps object each render",
    after: "useMemo sidebarProps",
    result: "improved",
  },
  {
    id: "layout_access",
    before: "cache() per request",
    after: "cache() per request (unchanged)",
    result: "neutral",
  },
  {
    id: "shell_i18n",
    before: "3 bundles SHELL_I18N",
    after: "3 bundles (unchanged)",
    result: "neutral",
  },
  {
    id: "middleware",
    before: "83.2 kB",
    after: "83.2 kB (unchanged)",
    result: "neutral",
  },
  {
    id: "currency_switcher",
    before: "static import in AppShell",
    after: "dynamic import (code-split header widget)",
    result: "improved",
  },
];
