export type EmployeeProfile = {
  id: string;
  fullName: string;
  email: string | null;
  roleKey: string;
  departmentKey: string | null;
  isActive: boolean;
  createdAt: string;
};

export type EmployeeDocument = {
  id: string;
  employeeId: string;
  documentType: string;
  fileName: string;
  storagePath: string;
  createdAt: string;
};

export type EmployeeHistoryEvent = {
  id: string;
  employeeId: string;
  eventType: string;
  eventLabel: string;
  createdAt: string;
};

export type EmployeeHierarchyNode = {
  employeeId: string;
  managerId: string | null;
  departmentKey: string | null;
  title: string | null;
  active: boolean;
};

export type EmployeeOrgChartNode = {
  id: string;
  label: string;
  roleKey: string;
  departmentKey: string | null;
  managerId: string | null;
};

export type EmployeeDomainSnapshot = {
  profiles: EmployeeProfile[];
  hierarchy: EmployeeHierarchyNode[];
  hierarchyTree: Array<{
    employeeId: string;
    managerId: string | null;
    children: unknown[];
    departmentKey: string | null;
    title: string | null;
  }>;
  orgChart: EmployeeOrgChartNode[];
  metrics: {
    total: number;
    active: number;
    inactive: number;
    byDepartment: Record<string, number>;
  };
};

