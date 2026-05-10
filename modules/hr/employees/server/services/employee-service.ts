import { computeEmployeeMetrics } from "@/modules/hr/employees/analytics/employee-metrics";
import { buildEmployeeHierarchyTree } from "@/modules/hr/employees/hierarchy/tree";
import { buildOrgChart } from "@/modules/hr/employees/orgchart/build-orgchart";
import { listEmployeeDocuments } from "@/modules/hr/employees/server/repositories/documents-repository";
import { listEmployeeProfiles } from "@/modules/hr/employees/server/repositories/employee-repository";
import { listEmployeeHierarchy } from "@/modules/hr/employees/server/repositories/hierarchy-repository";
import { listEmployeeHistory } from "@/modules/hr/employees/server/repositories/history-repository";

export async function getEmployeeDomainSnapshot() {
  const [profiles, hierarchy] = await Promise.all([listEmployeeProfiles(), listEmployeeHierarchy()]);
  return {
    profiles,
    hierarchy,
    hierarchyTree: buildEmployeeHierarchyTree(hierarchy),
    orgChart: buildOrgChart(profiles, hierarchy),
    metrics: computeEmployeeMetrics(profiles),
  };
}

export async function getEmployeeDomainDetails(employeeId: string) {
  const [documents, history] = await Promise.all([
    listEmployeeDocuments(employeeId),
    listEmployeeHistory(employeeId),
  ]);
  return { documents, history };
}

