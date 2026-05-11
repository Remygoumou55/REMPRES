"use server";

import { revalidateDashboardFoundationScope } from "@/lib/server/revalidate-domains";

export async function refreshDashboardFoundationAction(deptKeys?: readonly string[]): Promise<void> {
  revalidateDashboardFoundationScope({ deptKeys });
}
