import type { DepartmentKey } from "@/lib/constants/departments";
import { getOperationalLinksForDepartment } from "../../constants/registry";
import type { DepartmentOperationalLink } from "../../types/domain";

export function listOperationalLinksForDepartment(deptKey: DepartmentKey): readonly DepartmentOperationalLink[] {
  return getOperationalLinksForDepartment(deptKey);
}
