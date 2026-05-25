import type { DepartmentOperationalLink } from "../types/domain";

export const CRM_OPERATIONAL_LINKS: readonly DepartmentOperationalLink[] = [
  {
    id: "vente-dept-kpi",
    vertical: "crm",
    href: "/dept/vente",
    labelKey: "deptDash.crm.link.deptKpi",
    primaryDeptKey: "vente",
  },
  { id: "crm-hub", vertical: "crm", href: "/vente/crm", labelKey: "deptDash.crm.link.hub", primaryDeptKey: "vente" },
  {
    id: "crm-pipeline",
    vertical: "crm",
    href: "/vente/crm/pipeline",
    labelKey: "deptDash.crm.link.pipeline",
    primaryDeptKey: "vente",
  },
  {
    id: "crm-opportunities",
    vertical: "crm",
    href: "/vente/crm/opportunities",
    labelKey: "deptDash.crm.link.opportunities",
    primaryDeptKey: "vente",
  },
  {
    id: "crm-activities",
    vertical: "crm",
    href: "/vente/crm/activities",
    labelKey: "deptDash.crm.link.activities",
    primaryDeptKey: "vente",
  },
  {
    id: "crm-analytics",
    vertical: "crm",
    href: "/vente/crm/analytics",
    labelKey: "deptDash.crm.link.analytics",
    primaryDeptKey: "vente",
  },
  {
    id: "crm-visual",
    vertical: "crm",
    href: "/vente/crm/visual",
    labelKey: "deptDash.crm.link.visual",
    primaryDeptKey: "vente",
  },
];
