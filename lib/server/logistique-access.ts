import { redirect } from "next/navigation";
import { normalizeRoleKey } from "@/lib/auth/roles";
import { hasSystemRootAuthority } from "@/lib/auth/system-authority";
import {
  assertMatrixModuleRead,
  matrixModuleCanDelete,
  matrixModulePermissions,
} from "@/lib/server/matrix-module-access";
import { getProfileAuthBrief } from "@/lib/server/permissions";

const LOGISTIQUE_MODULES = ["logistics", "logistique"] as const;

const LOGISTIQUE_LEGACY_ROLE_KEYS = [
  "responsable_logistique",
  "directeur_general",
  "super_admin",
  "manager",
] as const;

const logistiqueLegacy = { legacyRoleKeys: LOGISTIQUE_LEGACY_ROLE_KEYS };

export async function assertLogistiqueRead(userId: string): Promise<void> {
  await assertMatrixModuleRead(userId, LOGISTIQUE_MODULES, logistiqueLegacy);
}

export async function canLogistiqueWrite(userId: string): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  if (!brief.ok || !brief.roleKey) return false;
  if (
    hasSystemRootAuthority({
      roleKey: brief.roleKey,
      systemAuthority: brief.systemAuthority,
    })
  ) {
    return false;
  }
  const normalized = normalizeRoleKey(brief.roleKey);
  if (LOGISTIQUE_LEGACY_ROLE_KEYS.some((r) => normalizeRoleKey(r) === normalized)) {
    return true;
  }
  const perms = await matrixModulePermissions(userId, LOGISTIQUE_MODULES);
  return perms.canCreate || perms.canUpdate;
}

export async function assertLogistiqueWrite(userId: string): Promise<void> {
  if (!(await canLogistiqueWrite(userId))) redirect("/access-denied");
}

export async function canLogistiqueDelete(userId: string): Promise<boolean> {
  return matrixModuleCanDelete(userId, LOGISTIQUE_MODULES, logistiqueLegacy);
}

export async function canLogistiqueApprove(userId: string): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  if (!brief.ok || !brief.roleKey) return false;
  if (
    hasSystemRootAuthority({
      roleKey: brief.roleKey,
      systemAuthority: brief.systemAuthority,
    })
  ) {
    return true;
  }
  const role = normalizeRoleKey(brief.roleKey);
  if (role === "directeur_general" || role === "manager") return true;
  const perms = await matrixModulePermissions(userId, LOGISTIQUE_MODULES);
  return perms.canUpdate;
}
