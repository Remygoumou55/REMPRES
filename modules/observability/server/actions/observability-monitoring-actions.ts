"use server";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { isObservabilityOperator } from "@/lib/server/permissions";
import { revalidateObservabilityScope } from "@/lib/server/revalidate-domains";
import { enqueueObservabilityHealthDigestJob } from "@/modules/observability/server/queues/enqueue-observability-jobs";
import { recordObservabilityGovernanceAudit } from "@/modules/observability/server/services/observability-governance-audit";

export async function enqueueObservabilityHealthDigestAction(): Promise<{ ok: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user?.id) return { ok: false, error: "auth" };
  if (!(await isObservabilityOperator(user.id))) return { ok: false, error: "forbidden" };

  const admin = getSupabaseAdminClient();
  const r = await enqueueObservabilityHealthDigestJob(admin, { createdBy: user.id });
  if ("error" in r) return { ok: false, error: r.error };

  await recordObservabilityGovernanceAudit({
    actionType: "observability.enqueue_health_digest",
    metadata: { job_id: r.id },
  });

  revalidateObservabilityScope();
  return { ok: true };
}
