"use server";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { isEcosystemOperator } from "@/lib/server/permissions";
import { revalidateEcosystemScope } from "@/lib/server/revalidate-domains";
import { enqueueEcosystemFederationDigestJob } from "@/modules/ecosystem/server/queues/enqueue-ecosystem-jobs";
import { recordEcosystemGovernanceAudit } from "@/modules/ecosystem/server/services/ecosystem-governance-audit";

export async function enqueueEcosystemFederationDigestAction(): Promise<{ ok: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user?.id) return { ok: false, error: "auth" };
  if (!(await isEcosystemOperator(user.id))) return { ok: false, error: "forbidden" };

  const admin = getSupabaseAdminClient();
  const r = await enqueueEcosystemFederationDigestJob(admin, { createdBy: user.id });
  if ("error" in r) return { ok: false, error: r.error };

  await recordEcosystemGovernanceAudit({
    actionType: "ecosystem.enqueue_federation_digest",
    metadata: { job_id: r.id },
  });

  revalidateEcosystemScope();
  return { ok: true };
}
