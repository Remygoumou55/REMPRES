"use server";

import { revalidateFinanceVisualDashboardScope } from "@/lib/server/revalidate-domains";

export async function refreshFinanceVisualDashboardAction(): Promise<void> {
  revalidateFinanceVisualDashboardScope();
}
