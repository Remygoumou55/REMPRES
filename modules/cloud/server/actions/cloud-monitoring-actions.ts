"use server";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { isCloudOperator } from "@/lib/server/permissions";
import { revalidateCloudScope } from "@/lib/server/revalidate-domains";
import { enqueueCloudOperationsDigestJob } from "@/modules/cloud/server/queues/enqueue-cloud-jobs";
import { recordCloudGovernanceAudit } from "@/modules/cloud/server/services/cloud-governance-audit";

export async function enqueueCloudOperationsDigestAction(): Promise<{ ok: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user?.id) return { ok: false, error: "auth" };
  if (!(await isCloudOperator(user.id))) return { ok: false, error: "forbidden" };

  const admin = getSupabaseAdminClient();
  const r = await enqueueCloudOperationsDigestJob(admin, { createdBy: user.id });
  if ("error" in r) return { ok: false, error: r.error };

  await recordCloudGovernanceAudit({
    actionType: "cloud.enqueue_operations_digest",
    metadata: { job_id: r.id },
  });

  revalidateCloudScope();
  return { ok: true };
}
