"use server";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { isComplianceOperator } from "@/lib/server/permissions";
import { revalidateComplianceScope } from "@/lib/server/revalidate-domains";
import { enqueueComplianceRiskScanJob } from "@/modules/compliance/server/queues/enqueue-compliance-jobs";
import { recordComplianceGovernanceAudit } from "@/modules/compliance/server/services/compliance-audit-hook";

export async function enqueueComplianceRiskScanAction(): Promise<{ ok: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user?.id) return { ok: false, error: "auth" };
  if (!(await isComplianceOperator(user.id))) return { ok: false, error: "forbidden" };

  const admin = getSupabaseAdminClient();
  const r = await enqueueComplianceRiskScanJob(admin, { createdBy: user.id });
  if ("error" in r) return { ok: false, error: r.error };

  await recordComplianceGovernanceAudit({
    actionType: "compliance.enqueue_risk_scan",
    metadata: { job_id: r.id },
  });

  revalidateComplianceScope();
  return { ok: true };
}
