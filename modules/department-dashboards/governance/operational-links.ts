import type { DepartmentOperationalLink } from "../types/domain";

export const GOVERNANCE_OPERATIONAL_LINKS: readonly DepartmentOperationalLink[] = [
  {
    id: "gov-platform",
    vertical: "governance",
    href: "/admin/governance-platform",
    labelKey: "deptDash.governance.link.platform",
  },
  {
    id: "compliance-hub",
    vertical: "governance",
    href: "/admin/compliance",
    labelKey: "deptDash.governance.link.compliance",
  },
  {
    id: "resilience-hub",
    vertical: "governance",
    href: "/admin/resilience",
    labelKey: "deptDash.governance.link.resilience",
  },
];
