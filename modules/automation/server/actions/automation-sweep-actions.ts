"use server";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { isAutomationOperator } from "@/lib/server/permissions";
import { revalidateAutomationScope } from "@/lib/server/revalidate-domains";
import {
  enqueueAutomationEscalationSweepJob,
  enqueueAutomationScheduleSweepJob,
} from "@/modules/automation/server/queues/enqueue-automation-jobs";
import { recordAutomationGovernanceAudit } from "@/modules/automation/server/services/automation-audit-hook";

async function guardOperator() {
  const user = await getServerSessionUser();
  if (!user?.id) return { ok: false as const, error: "auth" };
  if (!(await isAutomationOperator(user.id))) return { ok: false as const, error: "forbidden" };
  return { ok: true as const, userId: user.id };
}

export async function enqueueAutomationScheduleSweepAction(): Promise<{ ok: boolean; error?: string }> {
  const g = await guardOperator();
  if (!g.ok) return { ok: false, error: g.error };

  const admin = getSupabaseAdminClient();
  const r = await enqueueAutomationScheduleSweepJob(admin, { createdBy: g.userId });
  if ("error" in r) return { ok: false, error: r.error };

  await recordAutomationGovernanceAudit({
    actionType: "automation.enqueue_schedule_sweep",
    metadata: { job_id: r.id },
  });

  revalidateAutomationScope();
  return { ok: true };
}

export async function enqueueAutomationEscalationSweepAction(): Promise<{ ok: boolean; error?: string }> {
  const g = await guardOperator();
  if (!g.ok) return { ok: false, error: g.error };

  const admin = getSupabaseAdminClient();
  const r = await enqueueAutomationEscalationSweepJob(admin, { createdBy: g.userId });
  if ("error" in r) return { ok: false, error: r.error };

  await recordAutomationGovernanceAudit({
    actionType: "automation.enqueue_escalation_sweep",
    metadata: { job_id: r.id },
  });

  revalidateAutomationScope();
  return { ok: true };
}
