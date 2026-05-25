import type { DepartmentOperationalLink } from "../types/domain";

export const LOGISTICS_OPERATIONAL_LINKS: readonly DepartmentOperationalLink[] = [
  {
    id: "logistics-dept-kpi",
    vertical: "logistics",
    href: "/dept/logistique",
    labelKey: "deptDash.logistics.link.deptKpi",
    primaryDeptKey: "logistique",
  },
  {
    id: "logistics-hub",
    vertical: "logistics",
    href: "/logistique",
    labelKey: "deptDash.logistics.link.hub",
    primaryDeptKey: "logistique",
  },
  {
    id: "logistics-dashboard",
    vertical: "logistics",
    href: "/logistique/dashboard",
    labelKey: "deptDash.logistics.link.dashboard",
    primaryDeptKey: "logistique",
  },
  {
    id: "logistics-stock",
    vertical: "logistics",
    href: "/logistique/stock",
    labelKey: "deptDash.logistics.link.stock",
    primaryDeptKey: "logistique",
  },
  {
    id: "logistics-entrepots",
    vertical: "logistics",
    href: "/logistique/entrepots",
    labelKey: "deptDash.logistics.link.entrepots",
    primaryDeptKey: "logistique",
  },
  {
    id: "logistics-visual",
    vertical: "logistics",
    href: "/logistique/visual",
    labelKey: "deptDash.logistics.link.visual",
    primaryDeptKey: "logistique",
  },
  {
    id: "logistics-achats",
    vertical: "logistics",
    href: "/logistique/achats",
    labelKey: "deptDash.logistics.link.achats",
    primaryDeptKey: "logistique",
  },
  {
    id: "logistics-fournisseurs",
    vertical: "logistics",
    href: "/logistique/fournisseurs",
    labelKey: "deptDash.logistics.link.fournisseurs",
    primaryDeptKey: "logistique",
  },
];
