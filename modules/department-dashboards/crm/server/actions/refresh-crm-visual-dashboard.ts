"use server";

import { revalidateCrmVisualDashboardScope } from "@/lib/server/revalidate-domains";

export async function refreshCrmVisualDashboardAction(): Promise<void> {
  revalidateCrmVisualDashboardScope();
}
