"use server";

import { revalidateHrVisualDashboardScope } from "@/lib/server/revalidate-domains";

export async function refreshHrVisualDashboardAction(): Promise<void> {
  revalidateHrVisualDashboardScope();
}
