"use server";

import { revalidateDepartmentDashboardsScope } from "@/lib/server/revalidate-domains";

export async function refreshDepartmentDashboardsAction(deptKey: string): Promise<void> {
  revalidateDepartmentDashboardsScope({ deptKey });
}
