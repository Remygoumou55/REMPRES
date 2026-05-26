/**
 * Runtime performance registry — Bloc 2 Étape 4.
 * Baseline et contrats d'optimisation (mesure documentée, pas de rewrite).
 */
export const RUNTIME_PERFORMANCE_VERSION = "runtime-cleanup-v2" as const;

/** Cache Next.js des digests hubs admin (automation / platform / observability). */
export const ADMIN_DIGEST_CACHE_TTL_SEC = 120 as const;

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
  {
    id: "layout_access_pending",
    before: "shell perms then countPendingApprovals (sequential)",
    after: "Promise.all for super-admin shell path",
    result: "improved",
  },
  {
    id: "admin_hub_digest",
    before: "publish*Digest on load (bus + DB) or cold build each navigation",
    after: "build only + memory TTL 120s + React.cache; publish on explicit actions",
    result: "improved",
  },
  {
    id: "executive_snapshot_finance",
    before: "full sales/expenses rows for month KPIs",
    after: "getFinanceTreasuryKpis + head count for transactions",
    result: "improved",
  },
  {
    id: "executive_revenue_chart",
    before: "6 sequential month queries",
    after: "6 parallel month queries",
    result: "improved",
  },
  {
    id: "dept_kpi_api",
    before: "KPI build then getRecentActivity",
    after: "activity fetch in parallel with KPI switch",
    result: "improved",
  },
  {
    id: "radix_tree_shake",
    before: "radix barrels in client bundles",
    after: "optimizePackageImports for @radix-ui/*",
    result: "improved",
  },
];
