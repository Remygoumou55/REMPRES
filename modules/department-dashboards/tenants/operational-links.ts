import type { DepartmentOperationalLink } from "../types/domain";

export const TENANTS_OPERATIONAL_LINKS: readonly DepartmentOperationalLink[] = [
  { id: "mt-hub", vertical: "tenants", href: "/admin/multitenant", labelKey: "deptDash.tenants.link.hub" },
];
