import { assertDepartmentDashboardDeptRead } from "@/modules/department-dashboards/server/security";

export async function assertHrVisualRead(userId: string): Promise<void> {
  await assertDepartmentDashboardDeptRead(userId, "rh");
}
