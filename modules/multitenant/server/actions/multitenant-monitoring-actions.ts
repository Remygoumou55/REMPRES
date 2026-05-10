"use server";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { isMultitenantOperator } from "@/lib/server/permissions";
import { revalidateMultitenantScope } from "@/lib/server/revalidate-domains";
import { enqueueMultitenantOrchestrationSweepJob } from "@/modules/multitenant/server/queues/enqueue-multitenant-jobs";
import { recordMultitenantGovernanceAudit } from "@/modules/multitenant/server/services/multitenant-governance-audit";

export async function enqueueMultitenantSweepAction(): Promise<{ ok: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user?.id) return { ok: false, error: "auth" };
  if (!(await isMultitenantOperator(user.id))) return { ok: false, error: "forbidden" };

  const admin = getSupabaseAdminClient();
  const r = await enqueueMultitenantOrchestrationSweepJob(admin, { createdBy: user.id });
  if ("error" in r) return { ok: false, error: r.error };

  await recordMultitenantGovernanceAudit({
    actionType: "multitenant.enqueue_orchestration_sweep",
    metadata: { job_id: r.id },
  });

  revalidateMultitenantScope();
  return { ok: true };
}
