"use server";

import { revalidateAdminPlatformDashboardScope } from "@/lib/server/revalidate-domains";

export async function refreshAdminPlatformDashboardAction(): Promise<void> {
  revalidateAdminPlatformDashboardScope();
}
