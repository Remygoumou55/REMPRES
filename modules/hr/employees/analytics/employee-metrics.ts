import type { EmployeeProfile } from "@/modules/hr/employees/types";

export function computeEmployeeMetrics(profiles: EmployeeProfile[]) {
  const total = profiles.length;
  const active = profiles.filter((profile) => profile.isActive).length;
  const inactive = total - active;
  const byDepartment = new Map<string, number>();
  for (const profile of profiles) {
    const key = profile.departmentKey ?? "UNASSIGNED";
    byDepartment.set(key, (byDepartment.get(key) ?? 0) + 1);
  }
  return { total, active, inactive, byDepartment: Object.fromEntries(byDepartment.entries()) };
}

