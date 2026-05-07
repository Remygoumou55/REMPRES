import type { DepartmentKpi } from "@/lib/governance/kpi/aggregate-kpi";

export type DepartmentComparisonRow = {
  departmentKey: string;
  departmentLabel: string;
  productivityScore: number;
  activityCount7d: number;
  usersCount: number;
  managersCount: number;
  rank: number;
};

function productivityScore(dept: DepartmentKpi): number {
  const managerFactor = dept.managersCount > 0 ? dept.managersCount : 1;
  return Math.round((dept.activityCount7d / managerFactor) * 100) / 100;
}

export function buildDepartmentComparisonRows(departments: DepartmentKpi[]): DepartmentComparisonRow[] {
  const scored = departments
    .map((dept) => ({
      departmentKey: dept.departmentKey,
      departmentLabel: dept.departmentLabel,
      productivityScore: productivityScore(dept),
      activityCount7d: dept.activityCount7d,
      usersCount: dept.usersCount,
      managersCount: dept.managersCount,
      rank: 0,
    }))
    .sort((a, b) => b.productivityScore - a.productivityScore);

  return scored.map((row, index) => ({ ...row, rank: index + 1 }));
}
