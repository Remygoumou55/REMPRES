"use server";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { isAiOperator } from "@/lib/server/permissions";
import { revalidateAiScope } from "@/lib/server/revalidate-domains";
import { enqueueAiInsightPipelineJob } from "@/modules/ai/server/queues/enqueue-ai-jobs";
import { recordAiGovernanceAudit } from "@/modules/ai/server/services/ai-governance-audit";

export async function enqueueAiInsightPipelineAction(): Promise<{ ok: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user?.id) return { ok: false, error: "auth" };
  if (!(await isAiOperator(user.id))) return { ok: false, error: "forbidden" };

  const admin = getSupabaseAdminClient();
  const r = await enqueueAiInsightPipelineJob(admin, { createdBy: user.id });
  if ("error" in r) return { ok: false, error: r.error };

  await recordAiGovernanceAudit({
    actionType: "ai.enqueue_insight_pipeline",
    metadata: { job_id: r.id },
  });

  revalidateAiScope();
  return { ok: true };
}
