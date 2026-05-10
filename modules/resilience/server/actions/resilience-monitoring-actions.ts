"use server";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { isResilienceOperator } from "@/lib/server/permissions";
import { revalidateResilienceScope } from "@/lib/server/revalidate-domains";
import { enqueueResilienceReliabilityDigestJob } from "@/modules/resilience/server/queues/enqueue-resilience-jobs";
import { recordResilienceGovernanceAudit } from "@/modules/resilience/server/services/resilience-governance-audit";

export async function enqueueResilienceReliabilityDigestAction(): Promise<{ ok: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user?.id) return { ok: false, error: "auth" };
  if (!(await isResilienceOperator(user.id))) return { ok: false, error: "forbidden" };

  const admin = getSupabaseAdminClient();
  const r = await enqueueResilienceReliabilityDigestJob(admin, { createdBy: user.id });
  if ("error" in r) return { ok: false, error: r.error };

  await recordResilienceGovernanceAudit({
    actionType: "resilience.enqueue_reliability_digest",
    metadata: { job_id: r.id },
  });

  revalidateResilienceScope();
  return { ok: true };
}
