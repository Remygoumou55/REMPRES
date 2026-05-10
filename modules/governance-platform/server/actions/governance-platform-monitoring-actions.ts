"use server";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { isGovernancePlatformOperator } from "@/lib/server/permissions";
import { revalidateGovernancePlatformScope } from "@/lib/server/revalidate-domains";
import { enqueueGovernancePlatformMaturityDigestJob } from "@/modules/governance-platform/server/queues/enqueue-governance-platform-jobs";
import { recordGovernancePlatformGovernanceAudit } from "@/modules/governance-platform/server/services/governance-platform-governance-audit";

export async function enqueueGovernancePlatformMaturityDigestAction(): Promise<{ ok: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user?.id) return { ok: false, error: "auth" };
  if (!(await isGovernancePlatformOperator(user.id))) return { ok: false, error: "forbidden" };

  const admin = getSupabaseAdminClient();
  const r = await enqueueGovernancePlatformMaturityDigestJob(admin, { createdBy: user.id });
  if ("error" in r) return { ok: false, error: r.error };

  await recordGovernancePlatformGovernanceAudit({
    actionType: "governance_platform.enqueue_maturity_digest",
    metadata: { job_id: r.id },
  });

  revalidateGovernancePlatformScope();
  return { ok: true };
}
