import type { DepartmentOperationalLink } from "../types/domain";

export const FINANCE_OPERATIONAL_LINKS: readonly DepartmentOperationalLink[] = [
  {
    id: "finance-dept-kpi",
    vertical: "finance",
    href: "/dept/finance",
    labelKey: "deptDash.finance.link.deptKpi",
    primaryDeptKey: "finance",
  },
  { id: "finance-hub", vertical: "finance", href: "/finance", labelKey: "deptDash.finance.link.hub", primaryDeptKey: "finance" },
  {
    id: "finance-dashboard",
    vertical: "finance",
    href: "/finance/dashboard",
    labelKey: "deptDash.finance.link.dashboard",
    primaryDeptKey: "finance",
  },
  {
    id: "finance-enterprise",
    vertical: "finance",
    href: "/finance/enterprise",
    labelKey: "deptDash.finance.link.enterprise",
    primaryDeptKey: "finance",
  },
  {
    id: "finance-visual",
    vertical: "finance",
    href: "/finance/visual",
    labelKey: "deptDash.finance.link.visual",
    primaryDeptKey: "finance",
  },
];
