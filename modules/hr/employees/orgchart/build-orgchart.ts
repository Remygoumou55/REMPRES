import type { EmployeeProfile, EmployeeHierarchyNode } from "@/modules/hr/employees/types";

export type OrgChartNode = {
  id: string;
  label: string;
  roleKey: string;
  departmentKey: string | null;
  managerId: string | null;
};

export function buildOrgChart(profiles: EmployeeProfile[], hierarchy: EmployeeHierarchyNode[]): OrgChartNode[] {
  const managerByEmployee = new Map<string, string | null>();
  for (const relation of hierarchy) managerByEmployee.set(relation.employeeId, relation.managerId);

  return profiles.map((profile) => ({
    id: profile.id,
    label: profile.fullName,
    roleKey: profile.roleKey,
    departmentKey: profile.departmentKey,
    managerId: managerByEmployee.get(profile.id) ?? null,
  }));
}

