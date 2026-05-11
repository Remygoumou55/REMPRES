"use server";

import { revalidateExecutiveDashboardScope } from "@/lib/server/revalidate-domains";

export async function refreshExecutiveDashboardAction(): Promise<void> {
  revalidateExecutiveDashboardScope();
}
