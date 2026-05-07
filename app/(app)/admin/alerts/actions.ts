"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isSuperAdmin } from "@/lib/server/permissions";
import { archiveGovernanceAlert, updateGovernanceAlertStatus } from "@/lib/governance/alerts/repository";
import { tryLogGovernanceAuditEvent } from "@/lib/governance/audit/log-audit-event";

async function assertSuperAdminActor(): Promise<string> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Non authentifie.");
  const allowed = await isSuperAdmin(data.user.id);
  if (!allowed) throw new Error("Acces refuse.");
  return data.user.id;
}

export async function acknowledgeAlertAction(alertId: string): Promise<void> {
  const actorUserId = await assertSuperAdminActor();
  await updateGovernanceAlertStatus({ alertId, status: "acknowledged" });
  await tryLogGovernanceAuditEvent({
    category: "governance",
    severity: "informational",
    actorUserId,
    actorRole: "super_admin",
    actionType: "alert_acknowledged",
    entityType: "governance_alerts",
    entityId: alertId,
    afterSnapshot: { status: "acknowledged" },
  });
  revalidatePath("/admin/alerts");
}

export async function resolveAlertAction(alertId: string): Promise<void> {
  const actorUserId = await assertSuperAdminActor();
  await updateGovernanceAlertStatus({ alertId, status: "resolved" });
  await tryLogGovernanceAuditEvent({
    category: "governance",
    severity: "informational",
    actorUserId,
    actorRole: "super_admin",
    actionType: "alert_resolved",
    entityType: "governance_alerts",
    entityId: alertId,
    afterSnapshot: { status: "resolved" },
  });
  revalidatePath("/admin/alerts");
}

export async function archiveAlertAction(alertId: string): Promise<void> {
  const actorUserId = await assertSuperAdminActor();
  await archiveGovernanceAlert({ alertId, actorUserId });
  await tryLogGovernanceAuditEvent({
    category: "archive",
    severity: "informational",
    actorUserId,
    actorRole: "super_admin",
    actionType: "alert_archived",
    entityType: "governance_alerts",
    entityId: alertId,
    afterSnapshot: { lifecycle: "archived" },
  });
  revalidatePath("/admin/alerts");
}
