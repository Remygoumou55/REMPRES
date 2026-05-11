export const DEPARTMENT_DASHBOARDS_CACHE_TAGS = {
  root: "department_dashboards",
  vertical: (vertical: string) => `department_dashboards_${String(vertical).trim().toLowerCase()}`,
} as const;
