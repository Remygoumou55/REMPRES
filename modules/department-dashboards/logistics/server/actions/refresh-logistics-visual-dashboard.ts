"use server";

import { revalidateLogisticsVisualDashboardScope } from "@/lib/server/revalidate-domains";

export async function refreshLogisticsVisualDashboardAction(): Promise<void> {
  revalidateLogisticsVisualDashboardScope();
}
