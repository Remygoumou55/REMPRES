"use server";

import { revalidatePath } from "next/cache";
import { updateCampaignMetrics } from "@/lib/server/marketing";
import type { CampaignMetrics } from "@/lib/utils/campaign-analytics";

export async function updateCampaignMetricsAction(
  campaignId: string,
  metrics: CampaignMetrics,
): Promise<{ success: boolean; error?: string }> {
  const result = await updateCampaignMetrics(campaignId, metrics);

  if (result.success) {
    revalidatePath("/marketing/campagnes");
    revalidatePath(`/marketing/campagnes/${campaignId}`);
    revalidatePath("/dept/marketing");
  }

  return result;
}
