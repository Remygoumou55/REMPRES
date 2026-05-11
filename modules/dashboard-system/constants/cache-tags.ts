/** Tags Next cache — utilisés par `revalidateTag` si une route dashboard adopte `unstable_cache`. */
export const DASHBOARD_FOUNDATION_CACHE_TAGS = {
  root: "dashboard_foundation",
  deptKpis: (deptKey: string) => `dashboard_foundation_dept_${String(deptKey).trim().toLowerCase()}`,
  snapshot: (id: string) => `dashboard_foundation_snapshot_${String(id).trim()}`,
} as const;
