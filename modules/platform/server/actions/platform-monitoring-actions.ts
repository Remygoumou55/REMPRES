"use server";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { isPlatformOperator } from "@/lib/server/permissions";
import { revalidatePlatformScope } from "@/lib/server/revalidate-domains";
import { enqueuePlatformRegistryDigestJob } from "@/modules/platform/server/queues/enqueue-platform-jobs";
import { recordPlatformGovernanceAudit } from "@/modules/platform/server/services/platform-governance-audit";

export async function enqueuePlatformRegistryDigestAction(): Promise<{ ok: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user?.id) return { ok: false, error: "auth" };
  if (!(await isPlatformOperator(user.id))) return { ok: false, error: "forbidden" };

  const admin = getSupabaseAdminClient();
  const r = await enqueuePlatformRegistryDigestJob(admin, { createdBy: user.id });
  if ("error" in r) return { ok: false, error: r.error };

  await recordPlatformGovernanceAudit({
    actionType: "platform.enqueue_registry_digest",
    metadata: { job_id: r.id },
  });

  revalidatePlatformScope();
  return { ok: true };
}
