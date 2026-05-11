import type { DepartmentKey } from "@/lib/constants/departments";
import type { DepartmentOperationalLink } from "../types/domain";
import { AI_OPERATIONAL_LINKS } from "../ai";
import { CLOUD_OPERATIONAL_LINKS } from "../cloud";
import { CRM_OPERATIONAL_LINKS } from "../crm";
import { FINANCE_OPERATIONAL_LINKS } from "../finance";
import { GOVERNANCE_OPERATIONAL_LINKS } from "../governance";
import { HR_OPERATIONAL_LINKS } from "../hr";
import { LOGISTICS_OPERATIONAL_LINKS } from "../logistics";
import { OBSERVABILITY_OPERATIONAL_LINKS } from "../observability";
import { TENANTS_OPERATIONAL_LINKS } from "../tenants";

export const ALL_DEPARTMENT_OPERATIONAL_LINKS: readonly DepartmentOperationalLink[] = [
  ...HR_OPERATIONAL_LINKS,
  ...FINANCE_OPERATIONAL_LINKS,
  ...CRM_OPERATIONAL_LINKS,
  ...LOGISTICS_OPERATIONAL_LINKS,
  ...AI_OPERATIONAL_LINKS,
  ...OBSERVABILITY_OPERATIONAL_LINKS,
  ...TENANTS_OPERATIONAL_LINKS,
  ...CLOUD_OPERATIONAL_LINKS,
  ...GOVERNANCE_OPERATIONAL_LINKS,
];

export function getOperationalLinksForDepartment(deptKey: DepartmentKey): readonly DepartmentOperationalLink[] {
  return ALL_DEPARTMENT_OPERATIONAL_LINKS.filter(
    (link) => link.primaryDeptKey === undefined || link.primaryDeptKey === deptKey,
  );
}
