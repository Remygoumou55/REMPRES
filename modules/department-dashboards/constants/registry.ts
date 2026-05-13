import type { DepartmentKey } from "@/lib/constants/departments";
import type { DepartmentOperationalLink } from "../types/domain";
import { AI_OPERATIONAL_LINKS } from "../ai/operational-links";
import { CLOUD_OPERATIONAL_LINKS } from "../cloud/operational-links";
import { CRM_OPERATIONAL_LINKS } from "../crm/operational-links";
import { FINANCE_OPERATIONAL_LINKS } from "../finance/operational-links";
import { GOVERNANCE_OPERATIONAL_LINKS } from "../governance/operational-links";
import { HR_OPERATIONAL_LINKS } from "../hr/operational-links";
import { LOGISTICS_OPERATIONAL_LINKS } from "../logistics/operational-links";
import { OBSERVABILITY_OPERATIONAL_LINKS } from "../observability/operational-links";
import { TENANTS_OPERATIONAL_LINKS } from "../tenants/operational-links";

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
