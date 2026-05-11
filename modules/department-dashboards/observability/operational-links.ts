import type { DepartmentOperationalLink } from "../types/domain";

export const OBSERVABILITY_OPERATIONAL_LINKS: readonly DepartmentOperationalLink[] = [
  { id: "obs-hub", vertical: "observability", href: "/admin/observability", labelKey: "deptDash.observability.link.hub" },
];
