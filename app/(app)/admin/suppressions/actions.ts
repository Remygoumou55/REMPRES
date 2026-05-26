"use server";

import { revalidatePath } from "next/cache";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { isSuperAdmin } from "@/lib/server/permissions";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { insertActivityLog } from "@/lib/server/insert-activity-log";

const ALLOWED_TABLES = [
  "clients",
  "products",
  "employees",
  "trainings",
  "missions",
  "campaigns",
  "leads",
] as const;

type AllowedTable = (typeof ALLOWED_TABLES)[number];

function isAllowedTable(table: string): table is AllowedTable {
  return (ALLOWED_TABLES as readonly string[]).includes(table);
}

const REVALIDATE_PATHS_BY_TABLE: Record<AllowedTable, readonly string[]> = {
  clients: ["/vente/clients", "/vente/clients/archives", "/dept/vente"],
  products: ["/vente/produits", "/vente/produits/archives", "/dept/vente"],
  employees: ["/rh/collaborateurs", "/dept/rh"],
  trainings: ["/formation/formations", "/dept/formation"],
  missions: ["/consultation/missions", "/dept/formation"],
  campaigns: ["/marketing/campagnes", "/dept/marketing"],
  leads: ["/marketing/leads", "/dept/marketing"],
};

function revalidateAfterMutation(table: AllowedTable): void {
  revalidatePath("/admin/suppressions");
  revalidatePath("/dashboard");
  for (const path of REVALIDATE_PATHS_BY_TABLE[table]) {
    revalidatePath(path);
  }
}

async function assertSuperAdminCaller(): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string }
> {
  const user = await getServerSessionUser();
  if (!user) return { ok: false, error: "Non authentifié" };
  if (!(await isSuperAdmin(user.id))) {
    return { ok: false, error: "Accès refusé — réservé au super admin" };
  }
  return { ok: true, userId: user.id };
}

async function safeLog(params: {
  actorUserId: string;
  actionKey: "restore" | "permanent_delete";
  table: AllowedTable;
  targetId: string;
}): Promise<void> {
  try {
    await insertActivityLog({
      actorUserId: params.actorUserId,
      moduleKey: "admin",
      actionKey: params.actionKey,
      targetTable: params.table,
      targetId: params.targetId,
      metadata: { surface: "/admin/suppressions" },
    });
  } catch {
    // Never block the mutation on logging failure.
  }
}

export async function restoreRecordAction(
  table: string,
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertSuperAdminCaller();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!isAllowedTable(table)) {
    return { success: false, error: "Table non autorisée" };
  }
  if (!id) return { success: false, error: "Identifiant manquant" };

  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from(table as never)
    .update({ deleted_at: null } as never)
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  await safeLog({
    actorUserId: auth.userId,
    actionKey: "restore",
    table,
    targetId: id,
  });

  revalidateAfterMutation(table);
  return { success: true };
}

export async function permanentDeleteAction(
  table: string,
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertSuperAdminCaller();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!isAllowedTable(table)) {
    return { success: false, error: "Table non autorisée" };
  }
  if (!id) return { success: false, error: "Identifiant manquant" };

  // Log BEFORE deletion — the row vanishes right after.
  await safeLog({
    actorUserId: auth.userId,
    actionKey: "permanent_delete",
    table,
    targetId: id,
  });

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from(table as never).delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidateAfterMutation(table);
  return { success: true };
}
