import type { DepartmentOperationalLink } from "../types/domain";

export const TENANTS_OPERATIONAL_LINKS: readonly DepartmentOperationalLink[] = [
  {
    id: "mt-hub",
    vertical: "tenants",
    href: "/admin/global-dashboard",
    labelKey: "deptDash.tenants.link.hub",
  },
];
