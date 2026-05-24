import type { DepartmentOperationalLink } from "../types/domain";

export const GOVERNANCE_OPERATIONAL_LINKS: readonly DepartmentOperationalLink[] = [
  {
    id: "gov-platform",
    vertical: "governance",
    href: "/admin/platform-dashboard",
    labelKey: "deptDash.governance.link.platform",
  },
  {
    id: "gov-audit",
    vertical: "governance",
    href: "/admin/audit",
    labelKey: "deptDash.governance.link.audit",
  },
  {
    id: "gov-approvals",
    vertical: "governance",
    href: "/admin/approvals",
    labelKey: "deptDash.governance.link.approvals",
  },
];
