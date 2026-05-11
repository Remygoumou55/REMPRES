import type { DepartmentOperationalLink } from "../types/domain";

export const HR_OPERATIONAL_LINKS: readonly DepartmentOperationalLink[] = [
  { id: "hr-dept-kpi", vertical: "hr", href: "/dept/rh", labelKey: "deptDash.hr.link.deptKpi", primaryDeptKey: "rh" },
  { id: "rh-hub", vertical: "hr", href: "/rh", labelKey: "deptDash.hr.link.hub", primaryDeptKey: "rh" },
  { id: "rh-dashboard", vertical: "hr", href: "/rh/dashboard", labelKey: "deptDash.hr.link.dashboard", primaryDeptKey: "rh" },
  { id: "rh-collaborateurs", vertical: "hr", href: "/rh/collaborateurs", labelKey: "deptDash.hr.link.collaborateurs", primaryDeptKey: "rh" },
  { id: "rh-contrats", vertical: "hr", href: "/rh/contrats", labelKey: "deptDash.hr.link.contrats", primaryDeptKey: "rh" },
  { id: "rh-recrutement", vertical: "hr", href: "/rh/recrutement", labelKey: "deptDash.hr.link.recrutement", primaryDeptKey: "rh" },
];
