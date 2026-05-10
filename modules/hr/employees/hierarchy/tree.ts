import type { EmployeeHierarchyNode } from "@/modules/hr/employees/types";

export type EmployeeHierarchyTreeNode = {
  employeeId: string;
  managerId: string | null;
  children: EmployeeHierarchyTreeNode[];
  departmentKey: string | null;
  title: string | null;
};

export function buildEmployeeHierarchyTree(nodes: EmployeeHierarchyNode[]): EmployeeHierarchyTreeNode[] {
  const map = new Map<string, EmployeeHierarchyTreeNode>();
  for (const node of nodes) {
    map.set(node.employeeId, {
      employeeId: node.employeeId,
      managerId: node.managerId,
      children: [],
      departmentKey: node.departmentKey,
      title: node.title,
    });
  }

  const roots: EmployeeHierarchyTreeNode[] = [];
  for (const node of Array.from(map.values())) {
    if (!node.managerId || !map.has(node.managerId)) {
      roots.push(node);
      continue;
    }
    map.get(node.managerId)?.children.push(node);
  }
  return roots;
}

